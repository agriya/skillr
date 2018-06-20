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
function SocialLogins_r_get($passed_values)
{
    foreach ($passed_values as $key => $values) {
        $ {
            $key
        } = $values;
    }
    switch ($r_resource_cmd) {
    case '/providers': // To get providers listing with Filters
        if ((!empty($authUser) && ($authUser['providertype'] == 'userpass' || ($authUser['providertype'] == 'admin' && empty($r_resource_filters['filter'])))) || empty($authUser)) {
            // For front end users - should display only active user list
            // Case 1: logged in && front end user
            // Case 2: logged in && admin user and not set filter
            // Case 3: Guest Users
            $conditions['is_active'] = 'AND';
            $val_arr[] = 't';
        } else if (!empty($r_resource_filters['filter']) && $r_resource_filters['filter'] != 'all') {
            if ($r_resource_filters['filter'] == 'active') {
                $conditions['is_active'] = 'AND';
                $val_arr[] = 't';
            } else if ($r_resource_filters['filter'] == 'inactive') {
                $conditions['is_active'] = 'AND';
                $val_arr[] = 'f';
            }
        }
        if (!empty($r_resource_filters['q'])) {
            $conditions['OR']['name'] = strtolower($r_resource_filters['q']);
            $val_arr[] = '%' . strtolower($r_resource_filters['q']) . '%';
        }
        $where = getWhereCondition($conditions);
        if (!empty($authUser) && $authUser['providertype'] == 'admin') {
            $field = '*';
        } else {
            $field = "id,created,modified,name,api_key,icon_class,button_class";
            if (!empty($r_resource_filters['field'])) {
                $fields = explode(",", $field);
                $check_values = explode(",", $r_resource_filters['field']);
                $temp = "";
                foreach ($check_values as $check_value) {
                    if (in_array(trim($check_value) , $fields)) {
                        $temp.= trim($check_value) . ", ";
                    }
                }
                $field = substr($temp, 0, -2);
            }
        }
        $sort = 'display_order';
        $sort_by = 'asc';
        $c_sql = "SELECT count(*) FROM providers" . $where;
        $sql = "SELECT row_to_json(d) FROM (SELECT $field FROM providers" . $where . " ORDER BY " . $sort . " " . $sort_by . ") as d ";
        break;

    case '/providers/?': // To get particular provider detail based on Id
        $val_arr[] = $r_resource_vars['providers'];
        if (!empty($authUser) && $authUser['providertype'] == 'admin') {
            $field = "*";
        } else {
            $field = "id,created,modified,name,api_key,icon_class,button_class";
            if (!empty($r_resource_filters['field'])) {
                $fields = explode(",", $field);
                $check_values = explode(",", $r_resource_filters['field']);
                $temp = "";
                foreach ($check_values as $check_value) {
                    if (in_array(trim($check_value) , $fields)) {
                        $temp.= trim($check_value) . ", ";
                    }
                }
                $field = substr($temp, 0, -2);
            }
        }
        $c_sql = "SELECT count(*) FROM providers WHERE id = $1";
        $sql = "SELECT row_to_json(d) FROM (SELECT $field FROM providers WHERE id = $1) as d ";
        break;
    }
    $return_plugin['sort'] = $sort;
    $return_plugin['c_sql'] = $c_sql;
    $return_plugin['sql'] = $sql;
    $return_plugin['field'] = $field;
    $return_plugin['sort_by'] = $sort_by;
    $return_plugin['query_timeout'] = $query_timeout;
    $return_plugin['limit'] = $limit;
    $return_plugin['conditions'] = $conditions;
    //$return_plugin['where'] =$where;
    $return_plugin['val_arr'] = $val_arr;
    return $return_plugin;
}
function SocialLogins_r_put($passed_values)
{
    foreach ($passed_values as $key => $values) {
        $ {
            $key
        } = $values;
    }
    switch ($r_resource_cmd) {
    case '/providers/?': // To update provider details based on Id
        $r_put['id'] = $r_resource_vars['providers'];
        if (!empty($authUser) && $authUser['providertype'] == 'admin') {
            if (!empty($r_put['modified'])) {
                unset($r_put['modified']);
            }
            $sql = true;
            $table_name = 'providers';
        } else {
            $response['error']['code'] = 1;
            $response['error']['message'] = 'Authentication failed';
        }
        break;
    }
    $plugin_return['sql'] = $sql;
    $plugin_return['table_name'] = $table_name;
    $plugin_return['r_put'] = $r_put;
    if (!empty($response)) {
        $return_plugin['response'] = $response;
    }
    return $plugin_return;
}
function SocialLogins_r_post($passed_values)
{
    foreach ($passed_values as $key => $values) {
        $ {
            $key
        } = $values;
    }
    $course_owner = array();
    $course_owner['user_id'] = '';
    switch ($r_resource_cmd) {
    case '/users/social_login':
        // In social login the email not set means we fource the user to provide the email
        // So after get the email from user call will come here
        $response = social_email_login($r_post);
        break;
    }
    $return_plugin['sql'] = $sql;
    if (!empty($table_name)) {
        $return_plugin['table_name'] = $table_name;
    }
    $return_plugin['r_post'] = $r_post;
    if (!empty($response)) {
        $return_plugin['response'] = $response;
    }
    return $return_plugin;
}
?>