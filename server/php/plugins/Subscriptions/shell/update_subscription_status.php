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
$app_path = dirname(dirname(dirname(dirname(__FILE__)))) . DIRECTORY_SEPARATOR;
require_once $app_path . 'config.inc.php';
require_once $app_path . 'constants.php';
require_once $app_path . 'libs' . DIRECTORY_SEPARATOR . 'core.php';
error_log("Entering cron sub 1 at " . date('Y-M-d H:i:s') , 3, APP_PATH . DIRECTORY_SEPARATOR . 'tmp' . DIRECTORY_SEPARATOR . 'logs' . DIRECTORY_SEPARATOR . "error.log");
// Getting settings of currency_code, enabled_plugins and SudoPay credentials
$conditions = array(
    ConstSettingCategories::SudoPay,
    'site.currency_code',
    'site.enabled_plugins'
);
$settings = pg_query_cache("SELECT * FROM settings WHERE setting_category_id = $1 OR name = $2 OR name = $3 order by display_order", $conditions);
$setting_options = array();
if (!empty($settings)) {
    foreach ($settings as $value) {
        $setting_options[$value['name']] = $value['value'];
    }
}
// Active records changed to PendingPayment status; once date is reached; We are again called payment and active after this action; Including SudoPay and PayPal;
$conditions = array(
    ConstSubscriptionStatuses::Active,
    date('Y-m-d H:i:s')
);
$user_subscriptions = pg_query_cache("SELECT us_logs.id as user_subscription_log_id, us.id as user_subscription_id, us.is_cancel_requested FROM user_subscription_logs us_logs left join user_subscriptions us on us.id = us_logs.user_subscription_id  WHERE us.subscription_status_id = $1 AND us_logs.subscription_status_id = $1 AND us_logs.subscription_end_date < $2", $conditions);
if (!empty($user_subscriptions)) {
    foreach ($user_subscriptions as $user_subscription) {
        $user_subscription_put['id'] = $user_subscription['user_subscription_id'];
        if ($user_subscription['is_cancel_requested'] == 1) {
            // If user cancel the plan previously, we will move status to Canceled, only when the plan end date is reached.
            $user_subscription_put['subscription_status_id'] = ConstSubscriptionStatuses::Canceled;
            $user_subscription_log_put['subscription_status_id'] = ConstSubscriptionStatuses::Canceled;
        } else {
            $user_subscription_put['subscription_status_id'] = ConstSubscriptionStatuses::PendingPayment;
            $user_subscription_log_put['subscription_status_id'] = ConstSubscriptionStatuses::Expired;
        }
        $result = pg_execute_update('user_subscriptions', $user_subscription_put);
        // Active log records changed to Expired status; once date is reached
        $user_subscription_log_put['id'] = $user_subscription['user_subscription_log_id'];
        $result = pg_execute_update('user_subscription_logs', $user_subscription_log_put);
    }
}
// Only calling payment to SudoPay site when only enabled SudoPay plugin case
if (!empty($setting_options['site.enabled_plugins']) && strpos($setting_options['site.enabled_plugins'], 'SudoPay') !== false) {
    // Including SudoPay vendor file
    require_once APP_PATH . DIRECTORY_SEPARATOR . 'server' . DIRECTORY_SEPARATOR . 'php' . DIRECTORY_SEPARATOR . 'plugins' . DIRECTORY_SEPARATOR . 'SudoPay' . DIRECTORY_SEPARATOR . 'sudopay.php';
    // For getting Domain name
    global $_server_domain_url;
    if (file_exists(APP_PATH . DIRECTORY_SEPARATOR . 'tmp' . DIRECTORY_SEPARATOR . 'cache' . DIRECTORY_SEPARATOR . 'site_url_for_shell.php')) {
        include_once APP_PATH . DIRECTORY_SEPARATOR . 'tmp' . DIRECTORY_SEPARATOR . 'cache' . DIRECTORY_SEPARATOR . 'site_url_for_shell.php';
    }
    $gateway_settings_options = $setting_options;
    $s = new SudoPay_API(array(
        'api_key' => !empty($gateway_settings_options['payment.sudopay_api_key']) ? $gateway_settings_options['payment.sudopay_api_key'] : '',
        'merchant_id' => !empty($gateway_settings_options['payment.sudopay_merchant_id']) ? $gateway_settings_options['payment.sudopay_merchant_id'] : '',
        'website_id' => !empty($gateway_settings_options['payment.sudopay_website_id']) ? $gateway_settings_options['payment.sudopay_website_id'] : '',
        'secret_string' => !empty($gateway_settings_options['payment.sudopay_secret_string']) ? $gateway_settings_options['payment.sudopay_secret_string'] : '',
        'is_test' => !empty($gateway_settings_options['payment.is_live_mode']) ? 0 : 1 //Reverse is_live_mode = 1 mean is_test should be assign to 0
        
    ));
    $sudopay_call_capture_post['merchant_id'] = $gateway_settings_options['payment.sudopay_merchant_id'];
    $sudopay_call_capture_post['website_id'] = $gateway_settings_options['payment.sudopay_website_id'];
    $sudopay_call_capture_post['item_name'] = 'subscriptions';
    $sudopay_call_capture_post['currency_code'] = $gateway_settings_options['site.currency_code'];
    $conditions = array(
        ConstSubscriptionStatuses::PendingPayment,
        date('Y-m-d H:i:s')
    );
    // Payment pending records - calling payment for reneval - code started
    // sudopay_gateway_id IS NOT NULL - So the record is only get SudoPay records; For PayPal IPN will come automatically from PayPal site.
    $user_subscriptions = pg_query_cache("SELECT * FROM user_subscriptions WHERE subscription_status_id = $1 AND sudopay_gateway_id IS NOT NULL AND sudopay_gateway_id != 1 AND ((last_payment_attempt + INTERVAL '24 hours') <= $2 OR last_payment_attempt IS NULL)", $conditions);
    if (!empty($user_subscriptions)) {
        foreach ($user_subscriptions as $user_subscription) {
            $conditions = array(
                $user_subscription['subscription_id']
            );
            $subscription_data = r_query("SELECT * FROM subscriptions WHERE id = $1", $conditions);
            $user_subscription_logs_post['user_id'] = $user_subscription['user_id'];
            $user_subscription_logs_post['user_subscription_id'] = $user_subscription['id'];
            $user_subscription_logs_post['subscription_id'] = $subscription_data['id'];
            $user_subscription_logs_post['subscription_status_id'] = ConstSubscriptionStatuses::Initiated;
            $user_subscription_logs_post['amount'] = $subscription_data['price'];
            $user_subscription_logs_result = pg_execute_insert('user_subscription_logs', $user_subscription_logs_post);
            $sudopay_call_capture_post['id'] = $user_subscription['id'];
            $sudopay_call_capture_post['buyer_email'] = $user_subscription['buyer_email'];
            $sudopay_call_capture_post['buyer_address'] = $user_subscription['buyer_address'];
            $sudopay_call_capture_post['buyer_city'] = $user_subscription['buyer_city'];
            $sudopay_call_capture_post['buyer_state'] = $user_subscription['buyer_state'];
            $sudopay_call_capture_post['buyer_country'] = $user_subscription['buyer_country'];
            $sudopay_call_capture_post['buyer_zip_code'] = $user_subscription['buyer_zip_code'];
            $sudopay_call_capture_post['buyer_phone'] = $user_subscription['buyer_phone'];
            $sudopay_call_capture_post['gateway_id'] = $user_subscription['sudopay_gateway_id'];
            $sudopay_call_capture_post['vault_key'] = $user_subscription['vault_key'];
            $sudopay_call_capture_post['x-user_subscription_id'] = $user_subscription['id'];
            $sudopay_call_capture_post['x-sudopay_payment_gateway_id'] = $user_subscription['sudopay_gateway_id'];
            $sudopay_call_capture_post['amount'] = $subscription_data['price'];
            $sudopay_call_capture_post['item_description'] = 'Subscription for ' . $subscription_data['name'];
            $hash = md5(ACE_SECRET_KEY . $user_subscription_logs_result['id'] . SITE_NAME);
            $sudopay_call_capture_post['notify_url'] = $_server_domain_url . '/ipn/process_ipn/user_subscription_logs/' . $user_subscription_logs_result['id'] . '/hash/' . $hash;
            $sudopay_call_capture_post['success_url'] = $_server_domain_url;
            $sudopay_call_capture_post['cancel_url'] = $_server_domain_url;
            $sudopay_call_capture_response = $s->callCapture($sudopay_call_capture_post);
            if (!empty($sudopay_call_capture_response['status']) && $sudopay_call_capture_response['status'] == "Captured") {
                $user_subscription_put['id'] = $user_subscription['id'];
                $user_subscription_put['subscription_status_id'] = ConstSubscriptionStatuses::Active;
                $result = pg_execute_update('user_subscriptions', $user_subscription_put);
                $user_subscription_log_post['id'] = $user_subscription_logs_result['id'];
                $user_subscription_log_post['subscription_start_date'] = date('Y-m-d H:i:s');
                $user_subscription_log_post['subscription_end_date'] = date('Y-m-d H:i:s', strtotime('+' . $subscription_data['interval_period'] . ' ' . $subscription_data['interval_unit']));
                $user_subscription_log_post['sudopay_payment_id'] = $sudopay_call_capture_response['id'];
                $user_subscription_log_post['subscription_status_id'] = ConstSubscriptionStatuses::Active;
                if (!empty($sudopay_call_capture_response['paykey'])) {
                    $user_subscription_log_post['paykey'] = $sudopay_call_capture_response['paykey'];
                }
                $result = pg_execute_update('user_subscription_logs', $user_subscription_log_post);
            } else {
                $user_subscription_put['id'] = $user_subscription['id'];
                $user_subscription_put['last_payment_attempt'] = date('Y-m-d H:i:s');
                $result = pg_execute_update('user_subscriptions', $user_subscription_put);
            }
        }
    }
}
