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
function CourseCheckout_r_get($passed_values)
{
    foreach ($passed_values as $key => $values) {
        $ {
            $key
        } = $values;
    }
    switch ($r_resource_cmd) {
    case '/transactions': // To get transactions listing with Filters
        $bool = false;
        if (!empty($r_resource_filters['filter']) && $r_resource_filters['filter'] == 'all' && !empty($authUser) && $authUser['providertype'] == 'admin') {
            // No conditions
            // Display all records in admin end
            
        } else {
            // For user end
            $conditions['OR']['user_id'] = 'OR';
            $val_arr[] = $authUser['id'];
            $conditions['OR']['teacher_user_id'] = 'OR';
            $val_arr[] = $authUser['id'];
            $bool = true;
        }
        if (!empty($r_resource_filters['q'])) {
            $conditions['OR']['name'] = strtolower($r_resource_filters['q']);
            $conditions['OR']['displayname'] = strtolower($r_resource_filters['q']);
            $val_arr[] = '%' . strtolower($r_resource_filters['q']) . '%';
            $val_arr[] = '%' . strtolower($r_resource_filters['q']) . '%';
        }
        $where = getWhereCondition($conditions);
        if (!empty($authUser) && ($authUser['providertype'] == 'admin' || $bool)) {
            $c_sql = "SELECT count(*) FROM transactions_listing" . $where;
            $sql = "SELECT row_to_json(d) FROM (SELECT $field FROM transactions_listing" . $where . " ORDER BY " . $sort . " " . $sort_by . ") as d ";
        } else {
            $response['error'] = 1;
            $response['message'] = 'Authentication failed';
        }
        break;

    case '/transactions/?': // To get particular transactions detail based on Id
        $val_arr[] = $r_resource_vars['transactions'];
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
        $couser_owner = r_query("SELECT user_id,teacher_user_id FROM transactions");
        if (!empty($authUser) && ($authUser['providertype'] == "admin" || $authUser['id'] == $couser_owner['user_id'] || $authUser['id'] == $couser_owner['teacher_user_id'])) {
            $c_sql = "SELECT count(*) FROM transactions_listing WHERE id = $1";
            $sql = "SELECT row_to_json(d) FROM (SELECT $field FROM transactions_listing WHERE id = $1) as d ";
        } else {
            $response['error'] = 1;
            $response['message'] = 'Authentication failed';
        }
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
    if (!empty($response)) {
        $return_plugin['response'] = $response;
    }
    $return_plugin['val_arr'] = $val_arr;
    return $return_plugin;
}
function CourseCheckout_r_post($passed_values)
{
    foreach ($passed_values as $key => $values) {
        $ {
            $key
        } = $values;
    }
    $course_owner = array();
    $course_owner['user_id'] = '';
    switch ($r_resource_cmd) {
    }
    $return_plugin['sql'] = $sql;
    $return_plugin['r_post'] = $r_post;
    $return_plugin['response'] = $response;
    return $return_plugin;
}
?>