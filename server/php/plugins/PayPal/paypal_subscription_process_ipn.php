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
require_once $app_path . 'libs' . DIRECTORY_SEPARATOR . 'core.php';
require_once APP_PATH . DIRECTORY_SEPARATOR . 'server' . DIRECTORY_SEPARATOR . 'php' . DIRECTORY_SEPARATOR . 'plugins' . DIRECTORY_SEPARATOR . 'PayPal' . DIRECTORY_SEPARATOR . 'functions.php';
require_once APP_PATH . DIRECTORY_SEPARATOR . 'server' . DIRECTORY_SEPARATOR . 'php' . DIRECTORY_SEPARATOR . 'plugins' . DIRECTORY_SEPARATOR . 'Subscriptions' . DIRECTORY_SEPARATOR . 'functions.php';
if (!empty($_POST)) {
    // Storing IPN logs
    $ipn_data['post_variable'] = serialize($_POST);
    $ipn_data['ip_id'] = r_saveIp();
    $ipn_data['ip_id'] = (!empty($ipn_data['ip_id'])) ? $ipn_data['ip_id'] : NULL;
	if(!empty($_GET['user_subscription_id'])) {
		$ipn_data['user_subscription_id'] = $_GET['user_subscription_id'];
	}
    $result = pg_execute_insert('ipn_logs', $ipn_data);
    // Todo - Need to store IPN Logs
    $hash = $_GET['hash'];
    if (!empty($_GET['user_subscription_id'])) {
        if ($hash == md5(ACE_SECRET_KEY . $_GET['user_subscription_id'] . SITE_NAME)) {
            $conditions = array(
                $_GET['user_subscription_id'],
            );
            $user_subscriptions = r_query("SELECT id, user_id, subscription_id, subscription_status_id FROM user_subscriptions WHERE id = $1", $conditions);
            // Code for getting txn_type = subscr_signup; (For Subscription Confirm IPN)
            if (!empty($_POST['txn_type']) && ($_POST['txn_type'] == 'subscr_payment' || $_POST['txn_type'] == 'subscr_signup')) {
				$conditionsForPayPalPlans = array(
					$user_subscriptions['user_id'],
					ConstPaymentGateways::PayPal,
					ConstSubscriptionStatuses::Active,
					$_GET['user_subscription_id']
				);
				$user_subscriptions_with_paypal = r_query("SELECT paypal_subscr_id FROM user_subscriptions WHERE user_id = $1 AND payment_gateway_id = $2 AND subscription_status_id = $3 AND id != $4", $conditionsForPayPalPlans);           
				if(!empty($user_subscriptions_with_paypal)) {
                        // Function calling in PayPal Plugin functions.php file
                        makePayPalSubscriptionCancelRequest($user_subscriptions_with_paypal['paypal_subscr_id']);
				}
				// To updating previous active records (other than this) to inactive (User have only one should be active at a time)
				updateSubscriptionPlansToCancel($user_subscriptions['user_id'], $_GET['user_subscription_id']);

				if($_POST['txn_type'] == 'subscr_signup') {
					// When subscr_signup call reveceives, updating subscr_id to user_subscriptions table; Its need to for canceling subscription
					$user_subscriptions_data[] = !empty($_POST['subscr_id']) ? $_POST['subscr_id'] : '';
					$user_subscriptions_data['id'] = $user_subscriptions['id'];
					$sql_query = "UPDATE user_subscriptions SET paypal_subscr_id = $1 WHERE id = $2";
					$result = pg_execute_query($sql_query, $user_subscriptions_data);
				}
				if($_POST['txn_type'] == 'subscr_payment' && $user_subscriptions['subscription_status_id'] != ConstSubscriptionStatuses::Active) {
					// When subscr_payment call reveceives, updating status to user_subscriptions table as active;
					$user_subscriptions_data['subscription_status_id'] = ConstSubscriptionStatuses::Active;
					$user_subscriptions_data['id'] = $user_subscriptions['id'];
					$sql_query = "UPDATE user_subscriptions SET subscription_status_id = $1 WHERE id = $2";
					$result = pg_execute_query($sql_query, $user_subscriptions_data);
					$conditions = array(
						$user_subscriptions['subscription_id']
					);
					// When subscr_payment call reveceives, inserting user_subscription_logs table
					$subscription_data = r_query("SELECT price, interval_period, interval_unit FROM subscriptions WHERE id = $1", $conditions);
					// Inserting new subscription log record
					$user_subscription_logs_post['user_id'] = $user_subscriptions['user_id'];
					$user_subscription_logs_post['user_subscription_id'] = $user_subscriptions['id'];
					$user_subscription_logs_post['subscription_id'] = $user_subscriptions['subscription_id'];;
					$user_subscription_logs_post['subscription_status_id'] = ConstSubscriptionStatuses::Active;
					$user_subscription_logs_post['subscription_start_date'] = date('Y-m-d H:i:s');
					$user_subscription_logs_post['subscription_end_date'] = date('Y-m-d H:i:s', strtotime('+' . $subscription_data['interval_period'] . ' ' . $subscription_data['interval_unit']));
					$user_subscription_logs_post['amount'] = $subscription_data['price'];
					$user_subscription_logs_result = pg_execute_insert('user_subscription_logs', $user_subscription_logs_post);
					_updateRevenue(null, $user_subscriptions['user_id']);
				}
			}
            // Ref: https://developer.paypal.com/docs/classic/ipn/integration-guide/IPNandPDTVariables/#id08CTB0S055Z__id08CTB80F0HS
            if ($user_subscriptions['subscription_status_id'] == ConstSubscriptionStatuses::Active && !empty($_POST['txn_type']) && ($_POST['txn_type'] == 'subscr_eot' || $_POST['txn_type'] == 'recurring_payment_expired' || $_POST['txn_type'] == 'subscr_cancel' || $_POST['txn_type'] == 'recurring_payment_suspended_due_to_max_failed_payment' || $_POST['txn_type'] == 'recurring_payment_profile_cancel' || $_POST['txn_type'] == 'recurring_payment_suspended')) {
				$data = array(
					date('Y-m-d H:i:s'),
					1,
					$_GET['user_subscription_id']
				);
				pg_execute_query("UPDATE user_subscriptions SET (modified, is_cancel_requested, subscription_canceled_date) = ($1, $2, $1) WHERE id = $3", $data);
            }
        }
    }
}
