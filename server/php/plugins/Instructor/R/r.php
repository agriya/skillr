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
function Instructor_r_get($passed_values)
{
    foreach ($passed_values as $key => $values) {
        $ {
            $key
        } = $values;
    }
    switch ($r_resource_cmd) {
    case '/me/stats': // To get user stats details
        if (!empty($authUser)) {
            $response['data']['revenue'] = 0;
            $response['data']['ratings'] = 0;
            $response['error']['code'] = 0;
            $data = r_query("select total_earned,total_withdrawn_amount,available_balance from users WHERE id = " . $authUser['id']);
            $response['data']['total_withdrawn_amount'] = $data['total_withdrawn_amount'];
            $response['data']['available_balance'] = $data['available_balance'];
            if (!empty($data)) {
                $response['data']['revenue'] = $data['total_earned'];
            }
            $data = r_query("select sum(total_rating) as total_rating, sum(course_user_feedback_count) as course_user_feedback_count from courses where user_id = " . $authUser['id']);
            $response['data']['ratings'] = !empty($data['total_rating']) ? round(($data['total_rating'] / $data['course_user_feedback_count']) , 2) : 0;
            $conditions = array(
                $authUser['id']
            );
            $data = pg_query_cache("SELECT COUNT(DISTINCT user_id) FROM course_users_listing WHERE teacher_user_id = $1", $conditions);
            $response['data']['students'] = $data[0]['count'];
        } else {
            $response['error'] = 1;
            $response['message'] = 'Authentication failed';
        }
        break;
    }
    $return_plugin['sort'] = $sort;
    $return_plugin['field'] = $field;
    $return_plugin['sort_by'] = $sort_by;
    $return_plugin['query_timeout'] = $query_timeout;
    $return_plugin['limit'] = $limit;
    $return_plugin['conditions'] = $conditions;
    $return_plugin['response'] = $response;
    return $return_plugin;
}
?>