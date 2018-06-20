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
//todo
function Coupons_r_get($passed_values)
{
    foreach ($passed_values as $key => $values) {
        $ {
            $key
        } = $values;
    }
    switch ($r_resource_cmd) {
    case '/coupons': // To get coupons listing with Filters
        if ($authUser['providertype'] != 'admin') {
            $conditions['teacher_user_id'] = 'AND';
            $val_arr[] = $authUser['id'];
        }
        if (!empty($r_resource_filters['course_id'])) {
            $conditions['course_id'] = 'AND';
            $val_arr[] = $r_resource_filters['course_id'];
        }
        if (!empty($r_resource_filters['q'])) {
            $conditions['OR']['coupon_code'] = strtolower($r_resource_filters['q']);
            $val_arr[] = '%' . strtolower($r_resource_filters['q']) . '%';
        }
        if (!empty($r_resource_filters['filter'])) {
            if ($r_resource_filters['filter'] == 'active') {
                $conditions['is_active'] = 'AND';
                $val_arr[] = 't';
            } else if ($r_resource_filters['filter'] == 'inactive') {
                $conditions['is_active'] = 'AND';
                $val_arr[] = 'f';
            }
        }
        $where = getWhereCondition($conditions);
        $c_sql = "SELECT count(*) FROM coupons " . $where;
        $sql = "SELECT row_to_json(d) FROM (SELECT $field FROM coupons " . $where . " ORDER BY " . $sort . " " . $sort_by . ") as d ";
        break;

    case '/coupons/?': // To get particular coupons detail based on Id
        $conditions = array(
            $r_resource_vars['coupons'],
            $authUser['id']
        );
        $coupon = r_query("SELECT coupons.id FROM coupons inner join courses on courses.id = coupons.course_id WHERE coupons.id = $1 and courses.user_id = $2", $conditions);
        if (!empty($coupon) || $authUser['providertype'] == 'admin') {
            $val_arr[] = $r_resource_vars['coupons'];
            $c_sql = "SELECT count(*) FROM coupons WHERE id = $1";
            $sql = "SELECT row_to_json(d) FROM (SELECT $field FROM coupons WHERE id = $1) as d ";
        } else {
            $response['error']['code'] = 1;
            $response['error']['message'] = 'Authentication failed';
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
    $return_plugin['val_arr'] = $val_arr;
    if (!empty($response)) {
        $return_plugin['response'] = $response;
    }
    return $return_plugin;
}
function Coupons_r_post($passed_values)
{
    foreach ($passed_values as $key => $values) {
        $ {
            $key
        } = $values;
    }
    $course_owner = array();
    $course_owner['user_id'] = '';
    switch ($r_resource_cmd) {
    case '/coupons': // To add coupons details
        $sql = false;
        if (!empty($r_post['course_id'])) {
            $conditions = array(
                $authUser['id'],
                $r_post['course_id']
            );
            if ($authUser['providertype'] != 'admin') {
                $course_owner = r_query("SELECT id, user_id FROM courses WHERE user_id = $1 and id = $2", $conditions);
            } else {
                $conditions = array(
                    $r_post['course_id']
                );
                $course_owner = r_query("SELECT id, user_id FROM courses WHERE id = $1", $conditions);
            }
            if ($authUser['providertype'] == 'admin' || !empty($course_owner)) {
                $r_post['teacher_user_id'] = $course_owner['user_id'];
                $r_post['coupon_code'] = strtoupper(substr(str_replace(' ', '', $authUser['displayname']) , 0, 2)) . '-' . strtotime('now');
                $table_name = 'coupons';
                $sql = true;
                break;
            } else {
                $response['error']['code'] = 1;
                $response['error']['message'] = 'Authentication failed';
            }
        } else {
            $response['error']['code'] = 1;
            $response['error']['message'] = 'Course ID is required';
        }
        break;
    }
    $return_plugin['sql'] = $sql;
    $return_plugin['table_name'] = $table_name;
    $return_plugin['r_post'] = $r_post;
    if (!empty($response)) {
        $return_plugin['response'] = $response;
    }
    return $return_plugin;
}
function Coupons_r_put($passed_values)
{
    foreach ($passed_values as $key => $values) {
        $ {
            $key
        } = $values;
    }
    switch ($r_resource_cmd) {
    case '/coupons/?': // To update coupons details based on Id
        $conditions = array(
            $authUser['id'],
            $r_resource_vars['coupons']
        );
        if ($authUser['providertype'] != 'admin') {
            $course_owner = r_query("SELECT id FROM coupons WHERE teacher_user_id = $1 and id = $2", $conditions);
        }
        unset($r_put['modified']);
        if ($authUser['providertype'] == 'admin' || !empty($course_owner)) {
            $r_put['id'] = $r_resource_vars['coupons'];
            if (isset($postedValues['is_active']) && $postedValues['is_active'] == 1) {
                $r_put['is_active'] = 't';
            }
            if (isset($postedValues['is_active']) && $postedValues['is_active'] == 0) {
                $r_put['is_active'] = 'f';
            }
            $table_name = 'coupons';
            $sql = true;
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
function Coupons_r_delete($passed_values)
{
    foreach ($passed_values as $key => $values) {
        $ {
            $key
        } = $values;
    }
    switch ($r_resource_cmd) {
    case '/coupons/?': // To delete coupons details based on Id
        $conditions = array(
            $authUser['id'],
            $r_resource_vars['coupons']
        );
        if ($authUser['providertype'] != 'admin') {
            $course_owner = r_query("SELECT id FROM coupons WHERE teacher_user_id = $1 and id = $2", $conditions);
        }
        if ($authUser['providertype'] == 'admin' || !empty($course_owner)) {
            $val_arr[] = $r_resource_vars['coupons'];
            $sql = "DELETE FROM coupons WHERE id = $1";
        } else {
            $response['error']['code'] = 1;
            $response['error']['message'] = 'Authentication failed';
        }
        break;
    }
    $return_plugin['val_arr'] = $val_arr;
    $return_plugin['sql'] = $sql;
    if (!empty($response)) {
        $return_plugin['response'] = $response;
    }
    return $return_plugin;
}
?>