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
$app_path = dirname(dirname(dirname(__FILE__))) . DIRECTORY_SEPARATOR;
require_once $app_path . 'config.inc.php';
require_once $app_path . 'constants.php';
require_once $app_path . 'libs/core.php';
function verifyAndUseCoupon($course_id, $user_id, $coupon_code)
{
    $conditions = array(
        $course_id,
        $coupon_code
    );
    $coupons = r_query("SELECT * FROM coupons WHERE course_id = $1 and coupon_code = $2", $conditions);
    if (!empty($coupons)) {
        if (($coupons['max_number_of_time_can_use'] <= $coupons['coupon_user_count']) || $coupons['is_active'] != 't') {
            $response = array(
                'error' => array(
                    'code' => 1,
                    'message' => 'Coupon code is expired.'
                )
            );
        } else {
            $course_user_post['booked_date'] = date('Y-m-d H:i:s');
            $course_user_post['course_id'] = $course_id;
            $course_user_post['user_id'] = $user_id;
            $course_user_post['course_user_status_id'] = ConstCourseUserStatuses::NotStarted;
            $course_user_post['coupon_id'] = $coupons['id'];
            $result = pg_execute_insert('course_users', $course_user_post);
            $course_user_id = $result['id'];
            $active_course_data = r_query("select count(id) as coupon_used_count from course_users WHERE course_id = " . $coupons['course_id'] . " AND coupon_id = " . $coupons['id']);
            $updateData = array();
            $updateData[] = $active_course_data['coupon_used_count'];
            $updateData[] = $coupons['id'];
            $sql_query = "UPDATE coupons SET coupon_user_count = ($1) WHERE id = $2";
            $result = pg_execute_query($sql_query, $updateData);
            _updateRevenue($course_id, $user_id);
            _updateCouponCount($coupons['id']);
            _mailToInstrutorForNewBooking($result['id']);
            $response = array(
                'error' => array(
                    'code' => 0
                )
            );
            $response['error']['message'] = "Success";
            $response['course_user_id'] = $course_user_id;
        }
    } else {
        $response = array(
            'error' => array(
                'code' => 1,
                'message' => 'Coupon code is not valid.'
            )
        );
    }
    return $response;
}
