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
function Payout_r_get($passed_values)
{
    foreach ($passed_values as $key => $values) {
        $ {
            $key
        } = $values;
    }
    switch ($r_resource_cmd) {
    case '/payouts': // Get market place supported sudopay payment gateways
        $c_sql = "SELECT count(*) FROM sudopay_payment_gateways where is_marketplace_supported = 1";
        $sql = "SELECT row_to_json(d) FROM (SELECT id, sudopay_gateway_id, sudopay_gateway_name, sudopay_gateway_details FROM sudopay_payment_gateways where is_marketplace_supported = 1 ORDER BY " . $sort . " " . $sort_by . ") as d ";
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
function Payout_r_post($passed_values)
{
    foreach ($passed_values as $key => $values) {
        $ {
            $key
        } = $values;
    }
    $course_owner = array();
    $course_owner['user_id'] = '';
    switch ($r_resource_cmd) {
    case '/payouts_connect': // To connect with Sudopay payment gateways by Current User
        // Including SudoPay vendor file
        require_once APP_PATH . DIRECTORY_SEPARATOR . 'server' . DIRECTORY_SEPARATOR . 'php' . DIRECTORY_SEPARATOR . 'plugins' . DIRECTORY_SEPARATOR . 'SudoPay' . DIRECTORY_SEPARATOR . 'sudopay.php';
        $conditions = array(
            4
        );
        $gateway_settings_options = array();
        $sudopay_settings_data = array();
        $settings = pg_query_cache("SELECT * FROM settings WHERE setting_category_id = $1 order by display_order", $conditions);
        if (!empty($settings)) {
            foreach ($settings as $value) {
                $gateway_settings_options[$value['name']] = $value['value'];
            }
        }
        $post_data['merchant_id'] = $gateway_settings_options['payment.sudopay_merchant_id'];
        $post_data['website_id'] = $gateway_settings_options['payment.sudopay_website_id'];
        $post_data['gateway_id'] = $r_post['gateway_id'];
        $post_data['name'] = $authUser['username'];
        $post_data['email'] = $authUser['email'];
        $hash = md5(ACE_SECRET_KEY . $r_post['gateway_id'] . $authUser['id'] . SITE_NAME);
        $post_data['return_url'] = getSiteUri() . '/#!/manage-course/payout/' . $r_post['course_id'] . '?sudopay_gateway_id=' . $post_data['gateway_id'];
        $post_data['notify_url'] = getSiteUri() . '/ipn/receiver_account_ipn/' . $r_post['gateway_id'] . '/users/' . $authUser['id'] . '/hash/' . $hash;
        $post_data['success_url'] = getSiteUri() . '/#!/manage-course/payout/' . $r_post['course_id'];
        $s = new SudoPay_API(array(
            'api_key' => !empty($gateway_settings_options['payment.sudopay_api_key']) ? $gateway_settings_options['payment.sudopay_api_key'] : '',
            'merchant_id' => !empty($gateway_settings_options['payment.sudopay_merchant_id']) ? $gateway_settings_options['payment.sudopay_merchant_id'] : '',
            'website_id' => !empty($gateway_settings_options['payment.sudopay_website_id']) ? $gateway_settings_options['payment.sudopay_website_id'] : '',
            'secret_string' => !empty($gateway_settings_options['payment.sudopay_secret_string']) ? $gateway_settings_options['payment.sudopay_secret_string'] : '',
            'is_test' => !empty($gateway_settings_options['payment.is_live_mode']) ? 0 : 1 //Reverse is_live_mode = 1 mean is_test should be assign to 0
            
        ));
        $response = $s->callCreateReceiverAccount($post_data);
        $sql = false;
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