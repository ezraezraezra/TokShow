<?php
header('Content-type: application/json; charset=utf-8');
require "info.php";
require 'sdk/OpenTokSDK.php';
/*
 * Author: Ezra Velazquez
 */
	/**
	 * Connecting to database
	 */
	//echo $hostname;
	$connection = mysql_connect($hostname, $user, $pwd);
	if(!$connection) {
		die("Error ".mysql_errno()." : ".mysql_error());
	}
	$db_selected = mysql_select_db($database, $connection);
	if(!$db_selected) {
		die("Error ".mysql_errno()." : ".mysql_error());
	}
	
if($_GET['comm'] == 'tbAPI') {
	$a = new OpenTokSDK(API_Config::API_KEY,API_Config::API_SECRET);
	$the_token = $a->generate_token('2e64995e8430731ecedd002cf38ddebc03bee515', RoleConstants::MODERATOR);
	$arr = array("token"=>$the_token);
}
	
// Get who's batting & who's on deck
if($_GET['comm'] == 'state') {
	$arr = getState($db_selected, $connection);
}
// Add user to queue / stage
else if($_GET['comm'] == 'add') {
	$arr = addUser($db_selected, $connection, $_GET['tb_id'], $_GET['user_status']);
}
// Remove user from queue / stage
else if($_GET['comm'] == 'remove') {
	$arr = removeUser($db_selected, $connection, $_GET['tb_id'], $_GET['user_status']);
}
// Update user from queue / stage
else if($_GET['comm'] == 'update') {
	$arr = updateUser($db_selected, $connection, $_GET['tb_id'], $_GET['user_status']);
}
// Get gaga connection id
else if($_GET['comm'] == 'gaga') {
	$arr = getGaga($db_selected, $connection);
}
// Clean the database
else if($_GET['comm'] == 'clean') {
	$arr = cleanDatabase($db_selected, $connection);
}

	/**
 	* Close connection
 	*/
	mysql_close($connection);
	$output = json_encode($arr);
	echo $output;

function cleanDatabase($db_selected, $connection) {
	
	$session_update = "UPDATE gaga SET user_status='5' WHERE user_status='2' OR user_status='3' OR user_status='4'";
	$session_update = submit_info($session_update, $connection, true);
	
	
	$arr = array("status"=>'200');
	
	return $arr;
}
	
function updateUser($db_selected, $connection, $tb_id, $user_status) {
	/**
	 *  PHP Talks to MySQL
	 *  A) Promote the user from queuer to batter
	 *  
	 **/
	
	$tb_id = mysql_escape_string($tb_id);
	$user_status = mysql_escape_string($user_status);
	
	# A)
	$session_update = "UPDATE gaga SET user_status='$user_status' WHERE tb_id='$tb_id'";
	$session_update = submit_info($session_update, $connection, true);
	
	
	$arr = array("status"=>'200');
	
	return $arr;
}
	
	
function promote() {
	/**
	 *  PHP Talks to MySQL
	 *  A) Promote the first inQueue user_id's to stage status
	 *  
	 **/
	
	# A)
	$session_request = "SELECT * FROM gaga WHERE user_status = '2' ORDER BY unique_id ASC LIMIT 1";
	$session_request = submit_info($session_request, $connection, true);
	while(($rows[] = mysql_fetch_assoc($session_request)) || array_pop($rows));
	
	
	foreach ($rows as $row):
		$on_stage =  "{$row['unique_id']}";
	endforeach;
	
	$session_update = "UDATE gaga SET user_status='3' WHERE unique_id='$on_stage'";
	$session_update = submit_info($session_update, $connection, true);
	
	
	$arr = array("status"=>'200');
}

function getGaga($db_selected, $connection) {
	//$on_stage;
	//echo "This is pre on_stage: ".$on_stage;
	$session_request = "SELECT * FROM gaga WHERE user_status = '4'";
	//echo "This is on connection: ".$connection."b;aj";
	$session_request = submit_info($session_request, $connection, true);
	//echo "This is on_stage: ".$on_stage;
	while(($rows[] = mysql_fetch_assoc($session_request)) || array_pop($rows));
	//$on_stage = NULL;
	foreach ($rows as $row):
		$on_stage =  "{$row['tb_id']}";
	endforeach;
	
	if(isset($on_stage) == true) {
		$arr = array("status"=>'200', "gaga_id"=>$on_stage);
		//echo"<br/>$arr<br/>";
	}
	else {
		$arr = array("status"=>'400');
		//echo"<br/>$arr<br/>";
	}
	
	return $arr;
	
}

function getState($db_selected, $connection) {	
	/**
	 *  PHP Talks to MySQL
	 *  A) Get onStage user_id's
	 *  B) Get inQueue user_id's
	 *  
	 **/
	
	# A)
	$stage_request = "SELECT * FROM gaga WHERE user_status = '3'";
	$stage_request = submit_info($stage_request, $connection, true);
	while(($rows_stage[] = mysql_fetch_assoc($stage_request)) || array_pop($rows_stage));
	
	$counter = 0;
	$on_stage[0] = 'none';
	foreach ($rows_stage as $row):
		$on_stage[$counter] =  "{$row['tb_id']}";
		$counter = $counter + 1;
	endforeach;
	
	# B)
	$queue_request = "SELECT * FROM gaga WHERE user_status = '2'";
	$queue_request = submit_info($queue_request, $connection, true);
	while(($rows[] = mysql_fetch_assoc($queue_request)) || array_pop($rows));
	
	$counter = 0;
	$on_queue[0] = 'none';
	foreach ($rows as $row):
		$on_queue[$counter] =  "{$row['tb_id']}";
		$counter = $counter + 1;
	endforeach;
	
	$arr = array("on_stage"=>$on_stage, "on_queue"=> $on_queue);

	return $arr;
}

function addUser($db_selected, $connection, $tb_id, $user_status) {
	/**
	 *  PHP Talks to MySQL
	 *  A) Check is user hasn't been added before
	 *  B) Add user to queue / stage
	 *  
	 **/
	
	$tb_id = mysql_escape_string($tb_id);
	$user_status = mysql_escape_string($user_status);
	
	# A)
	$session_request = "INSERT INTO gaga (tb_id, user_status) VALUES('$tb_id', '$user_status')";
	$session_request = submit_info($session_request, $connection, true);
		
	$arr = array("status"=>'200');
	
	return $arr;
}

function removeUser($db_selected, $connection, $tb_id, $user_status) {
	/**
	 *  PHP Talks to MySQL
	 *  A) Remove user from queue / stage
	 *  
	 **/
	
	$tb_id = mysql_escape_string($tb_id);
	$user_status = mysql_escape_string($user_status);
	
	# A)
	$session_request = "UPDATE gaga SET user_status='$user_status' WHERE tb_id='$tb_id'";
	$session_request = submit_info($session_request, $connection, true);
		
	$arr = array("status"=>'200');
	
	return $arr;
	
	// UPDATE THE DATABASE ?!?!?
}

function submit_info($data, $conn, $return) {
	$result = mysql_query($data,$conn);
	if(!$result) {
		die("Error ".mysql_errno()." : ".mysql_error());
	}
	else if($return == true) {
		return $result;
	}
}



?>