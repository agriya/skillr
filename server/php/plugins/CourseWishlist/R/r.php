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
function CourseWishlist_r_get($passed_values)
{
    foreach ($passed_values as $key => $values) {
        $ {
            $key
        } = $values;
    }
    switch ($r_resource_cmd) {
    case '/users/?/course_favourites': // To get user wise course favourites detail based on User Id
        $val_arr[] = $r_resource_vars['users'];
        $where = '';
        if (!empty($r_resource_filters['q'])) {
            $val_arr[] = '%' . strtolower($r_resource_filters['q']) . '%';
            $where = ' AND course_title like $2';
        }
        $field = "id,user_id,displayname,course_id,course_title,course_slug,price,average_rating,total_rating,course_user_feedback_count,course_image,image_hash,subtitle,instructional_level_id,instructional_level_name,category_id,category_name,parent_category_id,parent_category_name,is_from_mooc_affiliate,mooc_affiliate_course_link,teacher_name,teacher_user_id";
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
        $c_sql = "SELECT count(*) FROM course_favourites_listing WHERE user_id = $1" . $where;
        $sql = "SELECT row_to_json(d) FROM (SELECT $field FROM course_favourites_listing WHERE user_id = $1 " . $where . " ORDER BY " . $sort . " " . $sort_by . ") as d ";
        break;

    case '/course_favourites': // To get course favourites listing with Filters
        if (!empty($r_resource_filters['q'])) {
            $conditions['OR']['displayname'] = strtolower($r_resource_filters['q']);
            $conditions['OR']['course_title'] = strtolower($r_resource_filters['q']);
            $val_arr[] = '%' . strtolower($r_resource_filters['q']) . '%';
            $val_arr[] = '%' . strtolower($r_resource_filters['q']) . '%';
        }
        $field = "id,displayname,course_title,course_slug,created";
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
        $where = getWhereCondition($conditions);
        $c_sql = "SELECT count(*) FROM course_favourites_listing" . $where;
        $field.= ", to_char(created, 'YYYY-MM-DD HH24:MI:SS') as created";
        $sql = "SELECT row_to_json(d) FROM (SELECT $field FROM course_favourites_listing" . $where . " ORDER BY " . $sort . " " . $sort_by . ") as d ";
        break;

    case '/course_favourites/?': // To get particular course favourites based on Id
        $val_arr[] = $r_resource_vars['course_favourites'];
        $where = '';
        if (!empty($r_resource_filters['q'])) {
            $val_arr[] = '%' . strtolower($r_resource_filters['q']) . '%';
            $where = ' AND course_title like $2';
        }
        $field = "id,average_rating,course_id,course_image,course_title,course_slug,course_user_feedback_count,displayname,created,price,total_rating,user_id";
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
        if ($authUser['providertype'] == 'admin') {
            $c_sql = "SELECT count(*) FROM course_favourites_listing WHERE id = $1" . $where;
            $sql = "SELECT row_to_json(d) FROM (SELECT $field FROM course_favourites_listing WHERE id = $1 " . $where . " ORDER BY " . $sort . " " . $sort_by . ") as d ";
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
    //$return_plugin['where'] =$where;
    $return_plugin['val_arr'] = $val_arr;
    if (!empty($response)) {
        $return_plugin['response'] = $response;
    }
    return $return_plugin;
}
function CourseWishlist_r_post($passed_values)
{
    foreach ($passed_values as $key => $values) {
        $ {
            $key
        } = $values;
    }
    $course_owner = array();
    $course_owner['user_id'] = '';
    switch ($r_resource_cmd) {
    case '/course_favourites': // To add course favourites details
        if ($authUser['id'] == $r_post['user_id']) {
            $conditions = array(
                $r_post['course_id'],
                true
            );
            $course = r_query("SELECT id FROM courses WHERE id = $1 and is_public = $2", $conditions);
            if ($course) {
                $conditions = array(
                    $r_post['course_id'],
                    $r_post['user_id']
                );
                $course_fav = r_query("SELECT id FROM course_favourites WHERE course_id = $1 and user_id = $2", $conditions);
                if (!$course_fav) {
                    $table_name = 'course_favourites';
                    $sql = true;
                } else {
                    $response['error']['code'] = 1;
                    $response['error']['message'] = "Already this Course exist";
                }
            } else {
                $response['error']['code'] = 1;
                $response['error']['message'] = 'This course is not a public course';
            }
        } else {
            $response['error']['code'] = 1;
            $response['error']['message'] = 'Authentication failed';
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
function CourseWishlist_r_delete($passed_values)
{
    foreach ($passed_values as $key => $values) {
        $ {
            $key
        } = $values;
    }
    switch ($r_resource_cmd) {
    case '/courses/?/course_favourites': // To delete course favourites details based on Course Id
        $conditions[] = $r_resource_vars['courses'];
        $data = r_query("SELECT id FROM course_favourites WHERE course_id = $1", $conditions);
        if (!empty($data)) {
            $val_arr[] = $data['id'];
            $sql = "DELETE FROM course_favourites WHERE id = $1";
        } else {
            $result['error'] = "Course id does not exist";
        }
        break;

    case '/course_favourites/?': // To delete course favourites details based on Id
        $val_arr[] = $r_resource_vars['course_favourites'];
        $course_favourites = r_query("SELECT user_id FROM course_favourites WHERE id = $1", $val_arr);
        if ($authUser['providertype'] == 'admin' || $authUser['id'] == $course_favourites['user_id']) {
            $sql = "DELETE FROM course_favourites WHERE id = $1";
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