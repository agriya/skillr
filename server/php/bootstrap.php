<?php
/**
 * Skillr
 *
 * PHP version 5
 *
 * @category   PHP
 * @package    skillr
 * @subpackage Core
 * @author     Agriya <info@agriya.com>
 * @copyright  2018 Agriya Infoway Private Ltd
 * @license    http://www.agriya.com/ Agriya Infoway Licence
 * @link       http://www.agriya.com
 */
/**
 * Main function to start
 *
 * @return string
 */
require_once 'config.inc.php';
require_once 'constants.php';
require_once 'libs' . DIRECTORY_SEPARATOR . 'core.php';
require_once 'libs' . DIRECTORY_SEPARATOR . 'Vendors' . DIRECTORY_SEPARATOR . 'OAuth2' . DIRECTORY_SEPARATOR . 'Autoloader.php';
function main()
{
    global $r_debug, $authUser, $token, $localAccessIps;
    global $post_exception_url, $put_exception_url, $exception_before_token, $exception_url, $admin_access_url, $put_admin_access_url;
    if (PHP_SAPI == 'cli') { // if command line mode...
        if ($_SERVER['argc'] < 2) {
            echo 'Usage: php ' . __FILE__ . ' <relative url>' . "\n";
            exit(1);
        }
        $argv = explode('?', urldecode($_SERVER['argv'][1])); // override '_url'
        $_GET['_url'] = $argv[0];
        if (!empty($argv[1])) {
            $cli_params = explode('&', $argv[1]);
            foreach ($cli_params as $key => $value) {
                $final_params = explode('=', $value);
                $_GET[$final_params[0]] = $final_params[1];
            }
        }
        $_SERVER['REQUEST_METHOD'] = 'GET';
    }
    if (!empty($_GET['_url'])) {
        $r_debug.= __LINE__ . ': ' . $_GET['_url'] . "\n";
        $url = '/' . $_GET['_url'];
        $url = str_replace('/v' . R_API_VERSION, '', $url);
        // routes...
        // Samples: 1. /products.json
        //          2. /products.json?page=1&key1=val1
        //          3. /users/5/products/10.json
        //          4. /products/10.json
        $_url_parts_with_querystring = explode('?', $url);
        $_url_parts_with_ext = explode('.', $_url_parts_with_querystring[0]);
        $r_resource_type = @$_url_parts_with_ext[1]; // 'json'
        $r_resource_filters = $_GET;
        if (!empty($r_resource_filters)) {
            // For ng-admin's filter
            // its come like filter={"q":"test123"} - so we need to split
            if (!empty($r_resource_filters['filter'])) {
                if (json_decode($r_resource_filters['filter'])) {
                    $param_filters = json_decode($r_resource_filters['filter'], true);
                    if (!empty($param_filters)) {
                        foreach ($param_filters as $key => $value) {
                            $r_resource_filters[$key] = $value;
                        }
                        if (!array_key_exists('filter', $param_filters)) {
                            unset($r_resource_filters['filter']);
                        }
                    } else {
                        if (!empty($r_resource_filters['filter'])) {
                            unset($r_resource_filters['filter']);
                        }
                    }
                }
            }
            if (!empty($r_resource_filters['other'])) {
                if (json_decode($r_resource_filters['other'])) {
                    $param_filters = json_decode($r_resource_filters['other'], true);
                    if (!empty($param_filters)) {
                        foreach ($param_filters as $key => $value) {
                            $r_resource_filters[$key] = $value;
                        }
                        if (!array_key_exists('', $param_filters)) {
                            unset($r_resource_filters['other']);
                        }
                    } else {
                        if (!empty($r_resource_filters['other'])) {
                            unset($r_resource_filters['other']);
                        }
                    }
                }
            }
        }
        unset($r_resource_filters['_url']); // page=1&key1=val1
        if (preg_match('/\/page\/(.*)/', $_url_parts_with_ext[0], $match)) {
            $r_resource_cmd = '/page/?';
            $r_resource_vars['page'] = $match[1];
        } else {
            // /users/5/products/10 -> /users/?/products/? ...
            $r_resource_cmd = preg_replace('/\/\d+/', '/?', $_url_parts_with_ext[0]);
            // /users/5/products/10 -> array('users' => 5, 'products' => 10) ...
            $r_resource_vars = array();
            if (preg_match_all('/([^\/]+)\/(\d+)/', $_url_parts_with_ext[0], $matches)) {
                for ($i = 0, $len = count($matches[0]); $i < $len; ++$i) {
                    $r_resource_vars[$matches[1][$i]] = $matches[2][$i];
                }
            }
        }
        if ($r_resource_type == 'json') {
            if (!empty($_GET['token']) && empty($_GET['refresh_token'])) {
                $conditions = array(
                    'client_id' => OAUTH_CLIENTID,
                    'access_token' => $_GET['token']
                );
                $response = r_query("SELECT user_id as username, expires, scope FROM oauth_access_tokens WHERE client_id = $1 AND access_token = $2", $conditions);
                $expires = strtotime($response['expires']);
                if (empty($response) || !empty($response['error']) || ($expires > 0 && $expires < time())) {
                    $response = array();
                    $response['error'] = array(
                        'code' => 1,
                        'message' => 'Unauthorized'
                    );
                }
                $user = $authUser = array();
                if (!empty($response['username'])) {
                    $conditions = array(
                        $response['username']
                    );
                    $user = r_query("SELECT * FROM users WHERE username = $1", $conditions);
                }
                if (!empty($user)) {
                    $authUser = array_merge($user);
                }
            } else if (empty($_GET['refresh_token'])) {
                $post_val = array(
                    'grant_type' => 'client_credentials',
                    'client_id' => OAUTH_CLIENTID,
                    'client_secret' => OAUTH_CLIENT_SECRET
                );
                $response = getToken($post_val);
                $token = $response['access_token'];
            }
            $checkRoleAccessURLs = true;
            if (empty($_GET['token'])) {
                $checkRoleAccessURLs = false;
            }
            if ($checkRoleAccessURLs || (in_array($r_resource_cmd, $exception_before_token))) {
                $is_valid_req = false;
                header('Content-Type: application/json');
                switch ($_SERVER['REQUEST_METHOD']) {
                case 'GET':
                    if (!empty($authUser) && (in_array($r_resource_cmd, $admin_access_url)) && $authUser['providertype'] == 'admin') {
                        header('X-cache-4-br: hit at ' . microtime(true));
                        r_get($r_resource_cmd, $r_resource_vars, $r_resource_filters);
                        $is_valid_req = true;
                    } else if ((!empty($authUser) && (!in_array($r_resource_cmd, $admin_access_url))) || (in_array($r_resource_cmd, $exception_url) && empty($authUser))) {
                        header('X-cache-4-br: hit at ' . microtime(true));
                        r_get($r_resource_cmd, $r_resource_vars, $r_resource_filters);
                        $is_valid_req = true;
                    } else {
                        $response = array();
                        $response['error'] = 1;
                        $response['error_message'] = 'Authentication failed';
                        echo json_encode($response);
                        exit;
                    }
                    break;

                case 'POST':
                    if ((!empty($authUser)) || (in_array($r_resource_cmd, $post_exception_url) && empty($authUser))) {
                        $r_post = json_decode(file_get_contents('php://input'));
                        $r_post = (array)$r_post;
                        r_post($r_resource_cmd, $r_resource_vars, $r_resource_filters, $r_post);
                        $is_valid_req = true;
                    } else {
                        $response = array();
                        $response['error'] = 1;
                        $response['error_message'] = 'Authentication failed';
                        echo json_encode($response);
                        exit;
                    }
                    break;

                case 'PUT':
                    if (!empty($authUser) && (in_array($r_resource_cmd, $put_admin_access_url)) && $authUser['providertype'] == 'admin') {
                        $r_put = json_decode(file_get_contents('php://input'));
                        $r_put = (array)$r_put;
                        r_put($r_resource_cmd, $r_resource_vars, $r_resource_filters, $r_put);
                        $is_valid_req = true;
                    } else if ((!empty($authUser) && (!in_array($r_resource_cmd, $put_admin_access_url))) || (in_array($r_resource_cmd, $put_exception_url) && empty($authUser))) {
                        $r_put = json_decode(file_get_contents('php://input'));
                        $r_put = (array)$r_put;
                        r_put($r_resource_cmd, $r_resource_vars, $r_resource_filters, $r_put);
                        $is_valid_req = true;
                    } else {
                        $response = array();
                        $response['error'] = 1;
                        $response['error_message'] = 'Authentication failed';
                        echo json_encode($response);
                        exit;
                    }
                    break;

                case 'DELETE':
                    if ((!empty($authUser))) {
                        r_delete($r_resource_cmd, $r_resource_vars, $r_resource_filters);
                        $is_valid_req = true;
                    } else {
                        $response = array();
                        $response['error'] = 1;
                        $response['error_message'] = 'Authentication failed';
                        echo json_encode($response);
                        exit;
                    }
                    break;

                default:
                    header('Access-Control-Allow-Origin: *');
                    header($_SERVER['SERVER_PROTOCOL'] . ' 501 Not Implemented', true, 501);
                    break;
                }
            } else {
                header('Access-Control-Allow-Origin: *');
                header($_SERVER['SERVER_PROTOCOL'] . ' 401 Authentication failed', true, 401);
            }
        }
    } else {
        header('Access-Control-Allow-Origin: *');
        header($_SERVER['SERVER_PROTOCOL'] . ' 404 Not Found', true, 404);
    }
    if (R_DEBUG) {
        header('X-RDebug: ' . $r_debug);
    }
}
function getFolderList($dir)
{
    $subFolders = array();
    $paths = scandir($dir);
    foreach ($paths as $path) {
        if ($path != '.' && $path != '..') {
            $subFolders[] = $path;
        }
    }
    return $subFolders;
}