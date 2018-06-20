<?php
/**
 * Common functions
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
 * Returns an OAuth2 access token to the client
 *
 * @param array $post Post data
 *
 * @return mixed
 */
function getToken($post)
{
    $old_server_method = $_SERVER['REQUEST_METHOD'];
    if (!empty($_SERVER['CONTENT_TYPE'])) {
        $old_content_type = $_SERVER['CONTENT_TYPE'];
    }
    $_SERVER['REQUEST_METHOD'] = 'POST';
    $_SERVER['CONTENT_TYPE'] = 'application/x-www-form-urlencoded';
    $_POST = $post;
    OAuth2\Autoloader::register();
    $oauth_config = array(
        'user_table' => 'users'
    );
    $val_array = array(
        'dsn' => 'pgsql:host=' . R_DB_HOST . ';dbname=' . R_DB_NAME . ';port=' . R_DB_PORT,
        'username' => R_DB_USER,
        'password' => R_DB_PASSWORD
    );
    $storage = new OAuth2\Storage\Pdo($val_array, $oauth_config);
    $server = new OAuth2\Server($storage);
    if (isset($_POST['grant_type']) && $_POST['grant_type'] == 'password') {
        $val_array = array(
            'password' => $_POST['password']
        );
        $users = array(
            $_POST['username'] => $val_array
        );
        $user_credentials = array(
            'user_credentials' => $users
        );
        $storage = new OAuth2\Storage\Memory($user_credentials);
        $server->addGrantType(new OAuth2\GrantType\UserCredentials($storage));
    } elseif (isset($_POST['grant_type']) && $_POST['grant_type'] == 'refresh_token') {
        $always_issue_new_refresh_token = array(
            'always_issue_new_refresh_token' => true
        );
        $server->addGrantType(new OAuth2\GrantType\RefreshToken($storage, $always_issue_new_refresh_token));
    } elseif (isset($_POST['grant_type']) && $_POST['grant_type'] == 'authorization_code') {
        $server->addGrantType(new OAuth2\GrantType\AuthorizationCode($storage));
    } else {
        $val_array = array(
            'client_secret' => OAUTH_CLIENT_SECRET
        );
        $clients = array(
            OAUTH_CLIENTID => $val_array
        );
        $credentials = array(
            'client_credentials' => $clients
        );
        $storage = new OAuth2\Storage\Memory($credentials);
        $server->addGrantType(new OAuth2\GrantType\ClientCredentials($storage));
    }
    $response = $server->handleTokenRequest(OAuth2\Request::createFromGlobals())->send('return');
    $_SERVER['REQUEST_METHOD'] = $old_server_method;
    if (!empty($old_content_type)) {
        $_SERVER['CONTENT_TYPE'] = $old_content_type;
    }
    return json_decode($response, true);
}
/**
 * Get base URL
 *
 * @return string
 */
function getBaseUri()
{
    global $_server_domain_url;
    $requestUri = isset($_SERVER['REQUEST_URI']) ? $_SERVER['REQUEST_URI'] : $_SERVER['PHP_SELF']; //Full Request URI
    $scriptName = $_SERVER['SCRIPT_NAME']; //Script path from docroot
    $baseUri = strpos($requestUri, $scriptName) === 0 ? $scriptName : str_replace('\\', '/', dirname(dirname($scriptName)));
    $path = $_server_domain_url . rtrim($baseUri, '/');
    return $path;
}
/**
 * Deletes a directory and all files and folders under it
 * @return Null
 * @param $dir String Directory Path
 */
function delete_files($dir)
{
    foreach (glob($dir . '/*') as $file) {
        if (is_dir($file)) delete_files($file);
        else unlink($file);
    }
    rmdir($dir);
}
/**
 * To login using social networking site accounts
 *
 * @param array   $data       User details fetched from Facebook
 *
 * @return array
 */
function social_email_login($data)
{
    $profile = $data['thrid_party_profile'];
    $profile->email = $data['email'];
    $provider_id = $profile->provider_id;
    $provider = $profile->provider;
    include 'Providers/' . $provider . '.php';
    $class_name = "Providers_" . ucfirst($provider);
    $adapter = new $class_name();
    $conditions = array(
        $data['email']
    );
    $isAlreadyRegisteredUser = r_query('SELECT count(*) FROM users WHERE email = $1', $conditions);
    if (empty($isAlreadyRegisteredUser['count'])) {
        //To login using social networking site accounts
        $response = social_login($profile, $provider_id, $provider, $adapter);
    } else {
        $response['thrid_party_login'] = 1;
        $response['error']['code'] = 1;
        $response['error']['message'] = 'Already registered email';
    }
    return $response;
}
/**
 * To login using social networking site accounts
 *
 * @params $provider
 * @params $pass_value
 * @return array
 */
function social_auth_login($provider, $pass_value = array())
{
    require 'Providers/' . $provider . '.php';
    $conditions = array(
        $provider
    );
    $provider_details = r_query('SELECT id, secret_key, api_key FROM providers WHERE LOWER(name) = $1', $conditions);
    $provider_id = $provider_details['id'];
    $pass_value['secret_key'] = $provider_details['secret_key'];
    $pass_value['api_key'] = $provider_details['api_key'];
    $class_name = "Providers_" . $provider;
    $adapter = new $class_name();
    $access_token = $adapter->getAccessToken($pass_value);
    $profile = $adapter->getUserProfile($access_token, $provider_details);
    $profile->access_token = $profile->access_token_secret = '';
    $profile->access_token = $access_token;
    $response = social_login($profile, $provider_id, $provider, $adapter);
    return $response;
}
/**
 * To login using social networking site accounts
 *
 * @params $profile
 * @params $provider_id
 * @params $provider
 * @params $adapter
 * @return array
 */
function social_login($profile, $provider_id, $provider, $adapter)
{
    $conditions = array(
        $provider
    );
    $bool = false;
    $provider_details = r_query('SELECT id, secret_key, api_key FROM providers WHERE LOWER(name) = $1', $conditions);
    $profile_picture_url = !empty($profile->photoURL) ? $profile->photoURL : '';
    $access_token = $profile->access_token;
    $response = $profile->access_token;
    $access_token_secret = $profile->access_token_secret;
    if ($provider_id == 2) {
        $access_token_arr = (array)$profile->access_token;
        $access_token = $access_token_arr['oauth_token'];
        $access_token_secret = $access_token_arr['oauth_token_secret'];
    }
    $checkProviderUser = r_query('SELECT id, user_id FROM provider_users WHERE provider_id = $1 AND foreign_id = $2 AND is_connected = true', array(
        $provider_id,
        $profile->identifier,
    ));
    if (!empty($checkProviderUser)) {
        $isAlreadyExistingUser = r_query('SELECT id, providertype, is_active FROM users WHERE id = $1', array(
            $checkProviderUser['user_id']
        ));
        pg_execute_query('UPDATE provider_users set modified = $1, access_token = $2 WHERE id = $3', array(
            date('Y-m-d H:i:s') ,
            $access_token,
            $checkProviderUser['id']
        ));
        $ip_id = r_saveIp();
        $users_update_data[] = date('Y-m-d H:i:s');
        $users_update_data[] = $isAlreadyExistingUser['id'];
        $sql_query = "UPDATE users SET (modified, last_logged_in_time, user_login_count) = ($1, $1, user_login_count + 1) WHERE id = $2";
        if (!empty($ip_id)) {
            $users_update_data[] = $ip_id;
            $sql_query = "UPDATE users SET (modified, last_logged_in_time, user_login_count, last_login_ip_id) = ($1, $1, user_login_count + 1, $3) WHERE id = $2";
        }
        $result = pg_execute_query($sql_query, $users_update_data);
        // Storing user_logins data
        $user_logins_data['user_agent'] = !empty($_SERVER['HTTP_USER_AGENT']) ? $_SERVER['HTTP_USER_AGENT'] : '';
        $user_logins_data['user_id'] = $isAlreadyExistingUser['id'];
        $ip_id = r_saveIp();
        if (!empty($ip_id)) {
            $user_logins_data['user_login_ip_id'] = $ip_id;
        }
        $user_logins_data['provider_type'] = $isAlreadyExistingUser['providertype'];
        $result = pg_execute_insert('user_logins', $user_logins_data);
        if ($isAlreadyExistingUser['is_active']) {
            $bool = true;
            $current_user_id = $checkProviderUser['user_id'];
            $response = array(
                'error' => array(
                    'code' => 0,
                    'message' => 'Already Connected. So just login'
                )
            );
        }
    } else {
        if (!empty($profile->email)) {
            $isAlreadyExistingUser = r_query('SELECT id FROM users WHERE email = $1', array(
                $profile->email,
            ));
            if ($isAlreadyExistingUser) {
                $bool = true;
                pg_execute_query("DELETE FROM provider_users WHERE user_id = $1 and provider_id = $2", array(
                    $isAlreadyExistingUser['id'],
                    $provider_id
                ));
                $provider_users_data['user_id'] = $isAlreadyExistingUser['id'];
                $provider_users_data['provider_id'] = $provider_id;
                $provider_users_data['foreign_id'] = $profile->identifier;
                $provider_users_data['access_token'] = $access_token;
                $provider_users_data['access_token_secret'] = $access_token_secret;
                $provider_users_data['is_connected'] = true;
                $provider_users_data['profile_picture_url'] = $profile_picture_url;
                $provider_users_data['profile_url'] = $profile->profileURL;
                $providerUser = pg_execute_insert('provider_users', $provider_users_data);
                $current_user_id = $isAlreadyExistingUser['id'];
                $response = array(
                    'error' => array(
                        'code' => 0,
                        'message' => 'Connected succesfully'
                    )
                );
            } else {
                $username = strtolower(str_replace(' ', '', $profile->displayName));
                $username = checkUserName($username);
                $table_name = 'users';
                if ($provider == 'facebook') {
                    $user_data['facebook_profile_link'] = $profile->profileURL;
                } else if ($provider == 'twitter') {
                    $user_data['twitter_profile_link'] = $profile->profileURL;
                } else if ($provider == 'google') {
                    $user_data['google_plus_profile_link'] = $profile->profileURL;
                }
                $ip_id = r_saveIp();
                $user_data['displayname'] = $username;
                $user_data['providertype'] = 'userpass';
                $user_data['authmethod'] = 'USER_PASSWORD';
                require_once 'Inflector.php';
                $inflector = new Inflector();
                $user_data['username'] = $inflector->slug($username, '-');
                $user_data['email'] = (property_exists($profile, 'email')) ? $profile->email : "";
                $user_data['password'] = getCryptHash('default'); // dummy password
                $user_data['isemailverified'] = true;
                $user_data['is_active'] = true;
                $user_data['last_logged_in_time'] = date('Y-m-d H:i:s');
                $user_data['user_login_count'] = 1;
                if (!empty($ip_id)) {
                    $user_data['last_login_ip_id'] = $ip_id;
                    $user_data['register_ip_id'] = $ip_id;
                }
                $new_user_id = pg_execute_insert($table_name, $user_data);
                $current_user_id = $new_user_id['id'];
                $provider_users_data['user_id'] = $new_user_id['id'];
                $provider_users_data['provider_id'] = $provider_id;
                $provider_users_data['foreign_id'] = $profile->identifier;
                $provider_users_data['access_token'] = $access_token;
                $provider_users_data['access_token_secret'] = $access_token_secret;
                $provider_users_data['is_connected'] = true;
                $provider_users_data['profile_picture_url'] = $profile_picture_url;
                $providerUser = pg_execute_insert('provider_users', $provider_users_data);
                // Storing user_logins data
                $user_agent = !empty($_SERVER['HTTP_USER_AGENT']) ? $_SERVER['HTTP_USER_AGENT'] : '';
                $user_logins_data['user_id'] = $new_user_id['id'];
                $ip_id = r_saveIp();
                if (!empty($ip_id)) {
                    $user_logins_data['user_login_ip_id'] = $ip_id;
                }
                $user_logins_data['user_agent'] = $user_agent;
                $user_logins_data['provider_type'] = $user_data['providertype'];
                $result = pg_execute_insert('user_logins', $user_logins_data);
                $response = array(
                    'error' => array(
                        'code' => 0,
                        'message' => 'Registered and connected succesfully'
                    )
                );
            }
        } else {
            $response['thrid_party_login_no_email'] = 1;
            $profile->provider_id = $provider_id;
            $profile->provider = $provider;
            $response['thrid_party_profile'] = $profile;
        }
    }
    if (!empty($current_user_id)) {
        $user = r_query("SELECT * FROM users WHERE id = $1", array(
            $current_user_id
        ));
        if (!empty($user)) {
            $post_url = getBaseUri() . '/token1.php';
            $post_val = array(
                'grant_type' => 'password',
                'username' => $user['username'],
                'password' => $user['password'],
                'client_id' => OAUTH_CLIENTID,
                'client_secret' => OAUTH_CLIENT_SECRET
            );
            $response = getToken($post_val);
            $authUser = $user;
            $response['error']['code'] = 0;
            $response['user'] = $user;
            $response['already_register'] = ($bool) ? '1' : '0';
        }
    }
    $response['thrid_party_login'] = 1;
    return $response;
}
/**
 * To check if username already exist in user table, if so generate new username with append number
 *
 * @param string $username User name which want to check if already exsist
 *
 * @return mixed
 */
function checkUserName($username)
{
    $conditions = array(
        $username
    );
    //check given name in users table
    $userExist = r_query("SELECT count(*) FROM users WHERE username = $1", $conditions);
    if (!empty($userExist) && $userExist['count'] != 0) {
        $org_username = $username;
        $i = 1;
        do {
            $username = $org_username . $i;
            $conditions = array(
                $username
            );
            $userExist = r_query("SELECT count(*) FROM users WHERE username = $1", $conditions);
            if ($userExist['count'] == 0) {
                break;
            }
            $i++;
        } while ($i < 1000);
    }
    return $username;
}
/**
 * To generate random string
 *
 * @param  $arr_characters
 * @param  $length
 * @return string
 */
function getRandomStr($arr_characters, $length)
{
    $rand_str = '';
    $characters_length = count($arr_characters);
    for ($i = 0; $i < $length; ++$i) {
        $rand_str.= $arr_characters[rand(0, $characters_length - 1) ];
    }
    return $rand_str;
}
/**
 * To generate the encrypted password
 *
 * @param  $str
 * @return string
 */
function getCryptHash($str)
{
    if (CRYPT_BLOWFISH) {
        if (version_compare(PHP_VERSION, '5.3.7') >= 0) { // http://www.php.net/security/crypt_blowfish.php
            $algo_selector = '$2y$';
        } else {
            $algo_selector = '$2a$';
        }
        $workload_factor = '12$'; // (around 300ms on Core i7 machine)
        $salt = $algo_selector . $workload_factor . getRandomStr(array_merge(array(
            '.',
            '/'
        ) , range('0', '9') , range('a', 'z') , range('A', 'Z')) , 22); // './0-9A-Za-z'
        
    } else if (CRYPT_MD5) {
        $algo_selector = '$1$';
        $salt = $algo_selector . getRandomStr(range(chr(33) , chr(127)) , 12); // actually chr(0) - chr(255), but used ASCII only
        
    } else if (CRYPT_SHA512) {
        $algo_selector = '$6$';
        $workload_factor = 'rounds=5000$';
        $salt = $algo_selector . $workload_factor . getRandomStr(range(chr(33) , chr(127)) , 16); // actually chr(0) - chr(255)
        
    } else if (CRYPT_SHA256) {
        $algo_selector = '$5$';
        $workload_factor = 'rounds=5000$';
        $salt = $algo_selector . $workload_factor . getRandomStr(range(chr(33) , chr(127)) , 16); // actually chr(0) - chr(255)
        
    } else if (CRYPT_EXT_DES) {
        $algo_selector = '_';
        $salt = $algo_selector . getRandomStr(array_merge(array(
            '.',
            '/'
        ) , range('0', '9') , range('a', 'z') , range('A', 'Z')) , 8); // './0-9A-Za-z'.
        
    } else if (CRYPT_STD_DES) {
        $algo_selector = '';
        $salt = $algo_selector . getRandomStr(array_merge(array(
            '.',
            '/'
        ) , range('0', '9') , range('a', 'z') , range('A', 'Z')) , 2); // './0-9A-Za-z'
        
    }
    return crypt($str, $salt);
}
/**
 * Insert current access ip address into IPs table
 *
 * @return int
 */
function r_saveIp()
{
    $ip_row = r_query('SELECT id FROM ips WHERE ip = $1', array(
        $_SERVER['REMOTE_ADDR']
    ));
    if (empty($ip_row['id'])) {
        $ip_data = array();
        $ip_data['ip'] = $_SERVER['REMOTE_ADDR'];
        $ip_data['host'] = gethostbyaddr($_SERVER['REMOTE_ADDR']);
        $ip_data['user_agent'] = !empty($_SERVER['HTTP_USER_AGENT']) ? $_SERVER['HTTP_USER_AGENT'] : '';
        $ip_row = pg_execute_insert('ips', $ip_data);
        return $ip_row['id'];
    } else {
        return $ip_row['id'];
    }
}
/**
 * Generate the conditions for SQL query
 *
 * @param  $conditions
 * @return string
 */
function getWhereCondition($conditions)
{
    $condition = '';
    $i = 1;
    if (!empty($conditions)) {
        if (!empty($conditions['OR'])) {
            $or_conditions = $conditions['OR'];
            unset($conditions['OR']);
        }
        $and_condition = '';
        if (!empty($conditions)) {
            foreach ($conditions As $key => $val) {
                $and_condition.= (!empty($and_condition)) ? ' AND ' : '';
                if (is_array($val)) {
                    if ($key == 'id !=') {
                        $j = 1;
                        foreach ($val As $k => $v) {
                            if ($j > 1) {
                                $and_condition.= (!empty($and_condition)) ? ' AND ' : '';
                            }
                            $and_condition.= 'id != ' . $v;
                            $j++;
                        }
                    } else {
                        $and_condition.= $key . ' = ANY ($' . $i . ')';
                    }
                } else {
                    if ($val == 'subgenres') {
                        $and_condition.= $key . ' != $' . $i;
                    } else if ($val == 'allsubgenres') {
                        $and_condition.= $key . ' != $' . $i;
                    } else if ($val == 'relatedsubgenres') {
                        $and_condition.= $key . ' != $' . $i;
                    } else if ($val == 'greaterThanRole') {
                        $and_condition.= '(' . $key . ' >= $' . $i . ' OR ' . $key . ' = 2)';
                    } else if ($val == 'greaterThan') {
                        $and_condition.= $key . ' > $' . $i;
                    } else if ($val == 'lessThen') {
                        $and_condition.= $key . ' < $' . $i;
                    } else if ($val == 'lessThenAndNotEqualGenres') {
                        $and_condition.= $key . ' < $' . $i . ' AND ' . $key . ' != 0';
                    } else if ($val == 'NotEqual') {
                        $and_condition.= $key . ' != $' . $i;
                    } else if ($val == 'ageBetween') {
                        $and_condition.= '$' . $i . ' BETWEEN age_from AND age_to';
                    } else if ($val == null) {
                        $and_condition.= $key . ' IS NULL';
                    } else if ($val == 'IS NOT NULL') {
                        $and_condition.= $key . ' IS NOT NULL';
                    } else if ($val == 'NotIn') {
                        $and_condition.= $key . ' NOT IN ($' . $i . ')';
                    } else if ($val == 'LIKE') {
                        $and_condition.= 'lower(' . $key . ') LIKE $' . $i;
                    } else {
                        $and_condition.= $key . ' = $' . $i;
                    }
                }
                if ($key !== 'id !=' && $val !== 'syndicateBetween' and $val !== null) {
                    $i++;
                }
            }
            $condition.= ' WHERE ' . $and_condition;
        }
        $or_condition = '';
        if (!empty($or_conditions)) {
            foreach ($or_conditions As $key => $val) {
                $or_condition.= (!empty($or_condition)) ? ' OR ' : '';
                if ($key == 'user_id' || $key == 'category_id' || $key == 'parent_category_id' || $key == 'teacher_user_id') {
                    $or_condition.= $key . ' = $' . $i;
                } else {
                    $or_condition.= 'lower(' . $key . ') LIKE $' . $i;
                }
                $i++;
            }
            if (!empty($condition)) {
                $condition.= ' AND (' . $or_condition . ')';
            } else {
                $condition.= ' WHERE (' . $or_condition . ')';
            }
        }
    }
    return $condition;
}
/**
 * To remove space in given filename
 *
 * @param string $filename To remove space and brackets from filename
 *
 * @return string
 */
function removeSpaceInName($filename)
{
    $file_name = str_replace('(', '', $filename);
    $file_name = str_replace(')', '', $file_name);
    $file_name = str_replace(' ', '-', $file_name);
    return $file_name;
}
