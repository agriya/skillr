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
function RatingAndReview_r_get($passed_values)
{
    foreach ($passed_values as $key => $values) {
        $ {
            $key
        } = $values;
    }
    switch ($r_resource_cmd) {
    case '/course_user_feedbacks/?': // To get particular course_user_feedback detail based on Id
        $val_arr[] = $r_resource_vars['course_user_feedbacks'];
        $conditions = array(
            $r_resource_vars['course_user_feedbacks']
        );
        $c_sql = "SELECT count(*) FROM course_user_feedbacks_listing WHERE id = $1";
        $sql = "SELECT row_to_json(d) FROM (SELECT $field FROM course_user_feedbacks_listing WHERE id = $1) as d ";
        break;

    case '/course_user_feedbacks': // To get course user feedbacks listing with Filters
        if (!empty($r_resource_filters['course_id'])) {
            $conditions['course_id'] = $r_resource_filters['course_id'];
            $val_arr[] = $r_resource_filters['course_id'];
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
        if (!empty($r_resource_filters['q'])) {
            $conditions['OR']['feedback'] = strtolower($r_resource_filters['q']);
            $conditions['OR']['review_title'] = strtolower($r_resource_filters['q']);
            $conditions['OR']['course_title'] = strtolower($r_resource_filters['q']);
            $conditions['OR']['displayname'] = strtolower($r_resource_filters['q']);
            $val_arr[] = '%' . strtolower($r_resource_filters['q']) . '%';
            $val_arr[] = '%' . strtolower($r_resource_filters['q']) . '%';
            $val_arr[] = '%' . strtolower($r_resource_filters['q']) . '%';
            $val_arr[] = '%' . strtolower($r_resource_filters['q']) . '%';
        }
        $where = getWhereCondition($conditions);
        $c_sql = "SELECT count(*) FROM course_user_feedbacks_listing" . $where;
        $sql = "SELECT row_to_json(d) FROM (SELECT $field FROM course_user_feedbacks_listing" . $where . " ORDER BY " . $sort . " " . $sort_by . ") as d ";
        break;

    case '/course_users/?/course_user_feedbacks': // To get course feedback based on course_user record
        $val_arr[] = $r_resource_vars['course_users'];
        $field = "id,created,course_id,course_user_id,feedback,review_title,rating,displayname,user_image,image_hash,user_id";
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
        $c_sql = "SELECT count(*) FROM course_user_feedbacks_listing WHERE course_user_id = $1";
        $sql = "SELECT row_to_json(d) FROM (SELECT $field FROM course_user_feedbacks_listing WHERE course_user_id = $1) as d ";
        break;

    case '/courses/?/course_user_feedbacks': // To get course users list based on course id
        if (!empty($r_resource_filters['q'])) {
            $conditions['OR']['name'] = strtolower($r_resource_filters['q']);
            $val_arr[] = '%' . strtolower($r_resource_filters['q']) . '%';
        }
        $val_arr[] = $r_resource_vars['courses'];
        $field = "id,created,course_id,course_user_id,feedback,review_title,rating,displayname,user_image,image_hash,user_id";
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
        $c_sql = "SELECT count(*) FROM course_user_feedbacks_listing WHERE course_id = $1";
        $sql = "SELECT row_to_json(d) FROM (SELECT $field FROM course_user_feedbacks_listing WHERE course_id = $1) as d ";
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
function RatingAndReview_r_post($passed_values)
{
    foreach ($passed_values as $key => $values) {
        $ {
            $key
        } = $values;
    }
    $course_owner = array();
    $course_owner['user_id'] = '';
    switch ($r_resource_cmd) {
    case '/course_user_feedbacks': // To add course user feedbacks details
        $sql = false;
        if ($authUser['providertype'] == 'admin' || $r_post['user_id'] == $authUser['id']) {
            $table_name = 'course_user_feedbacks';
            $bool = false;
            if (!empty($r_post['course_id']) && !empty($r_post['user_id']) && !empty($r_post['course_user_id'])) {
                $conditions = array(
                    $r_post['course_user_id'],
                    $r_post['user_id'],
                    $r_post['course_id']
                );
                $course_user = r_query("SELECT id FROM course_users WHERE id = $1 and user_id = $2 and course_id = $3", $conditions);
                if ($course_user) {
                    $bool = true;
                }
                $course_user_feedback = r_query("SELECT id FROM course_user_feedbacks WHERE course_user_id = $1 and user_id = $2 and course_id = $3", $conditions);
                if ($course_user_feedback) {
                    $bool = false; // avoiding duplicate inserts
                    
                }
            }
            if ($authUser['providertype'] == 'admin' || $bool) {
                $sql = true;
            }
        } else {
            $response['error']['code'] = 1;
            $response['error']['message'] = 'Authentication failed';
        }
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
function RatingAndReview_r_put($passed_values)
{
    foreach ($passed_values as $key => $values) {
        $ {
            $key
        } = $values;
    }
    switch ($r_resource_cmd) {
    case '/course_user_feedbacks/?': // To update course_user_feedbacks details based on Id
        $table_name = 'course_user_feedbacks';
        $r_put['id'] = $r_resource_vars['course_user_feedbacks'];
        if (!empty($authUser)) {
            $conditions = array(
                $authUser['id'],
                $r_put['id']
            );
            $course_user_feedback_data = r_query("SELECT id FROM course_user_feedbacks WHERE user_id = $1 and id = $2", $conditions);
            if (!empty($course_user_feedback_data) || $authUser['providertype'] == 'admin') {
                $field = "id,course_id,user_id,feedback,review_title,rating";
                $fields = explode(",", $field);
                $put_values = $r_put;
                $r_put = array();
                foreach ($put_values as $key => $value) {
                    if (in_array(trim($key) , $fields)) {
                        $r_put[$key] = $value;
                    }
                }
                $sql = true;
            } else {
                $response['error']['code'] = 1;
                $response['error']['message'] = 'Authentication failed';
            }
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
function RatingAndReview_r_delete($passed_values)
{
    foreach ($passed_values as $key => $values) {
        $ {
            $key
        } = $values;
    }
    switch ($r_resource_cmd) {
    case '/course_user_feedbacks/?': // To delete Course user feedbacks details based on Id
        $val_arr[] = $r_resource_vars['course_user_feedbacks'];
        $conditions = array(
            $authUser['id'],
            $r_resource_vars['course_user_feedbacks']
        );
        $course_user_feedback_data = r_query("SELECT id FROM course_user_feedbacks WHERE user_id = $1 and id = $2", $conditions);
        if (!empty($course_user_feedback_data) || $authUser['providertype'] == 'admin') {
            $sql = "DELETE FROM course_user_feedbacks WHERE id = $1";
        } else {
            $result['error'] = "Authentication failed";
        }
        break;
    }
    $return_plugin['val_arr'] = $val_arr;
    $return_plugin['sql'] = $sql;
    if (!empty($result)) {
        $return_plugin['result'] = $result;
    }
    return $return_plugin;
}
?>