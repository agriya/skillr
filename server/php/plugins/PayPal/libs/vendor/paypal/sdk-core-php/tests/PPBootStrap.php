<?php
/**
 * Please run composer update from the root folder to run test cases
 */

if(file_exists(dirname(__FILE__) . '/../PPBootstrap.php')) {
    require dirname(__FILE__) . '/../PPBootstrap.php';
} else if(file_exists(dirname(__FILE__) . '/../vendor/autoload.php')) {
	define('PP_CONFIG_PATH', dirname(__FILE__));
    require dirname(__FILE__) . '/../vendor/autoload.php';
}
