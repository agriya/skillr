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
function processSudoPaySubscriptionIPN($get, $post)
{
    $hash = $get['hash'];
    if ($hash == md5(ACE_SECRET_KEY . $get['user_subscription_logs_id'] . SITE_NAME)) {
        if (!empty($post['status']) && $post['status'] == 'Captured' && $post['id'] != null) {
            if (!empty($post['x-user_subscription_id'])) {
                $conditions = array(
                    $post['x-user_subscription_id'],
                    ConstSubscriptionStatuses::Active
                );
                $user_subscriptions = r_query("SELECT * FROM user_subscriptions WHERE id = $1 AND subscription_status_id != $2", $conditions);
                if (!empty($user_subscriptions)) {
                    // To updating previous active records (other than this) to inactive (User have only one should be active at a time)
                    updateSubscriptionPlansToCancel($user_subscriptions['user_id']);
                    $user_subscriptions_put['id'] = $user_subscriptions['id'];
                    $user_subscriptions_put['subscription_status_id'] = ConstSubscriptionStatuses::Active;
                    $result = pg_execute_update('user_subscriptions', $user_subscriptions_put);
                }
                if (!empty($post['x-sudopay_payment_gateway_id']) && $post['x-sudopay_payment_gateway_id'] == 1) { // For PayPal Subscription, we received old $get['user_subscription_logs_id'], So we need to to insert a record in user_subscription_logs table
                    if (!empty($user_subscriptions)) { // This is for avoiding duplication record inserting when duplicated IPN receices
                        $user_subscription_logs_post['user_id'] = $user_subscriptions['user_id'];
                        $user_subscription_logs_post['user_subscription_id'] = $user_subscriptions['id'];
                        $user_subscription_logs_post['subscription_id'] = $user_subscriptions['subscription_id'];;
                        $user_subscription_logs_post['subscription_status_id'] = ConstSubscriptionStatuses::Active;
                        $user_subscription_logs_post['sudopay_payment_id'] = $post['id'];
                        $user_subscription_logs_post['paykey'] = $post['paykey'];
                        $conditions = array(
                            $user_subscriptions['subscription_id']
                        );
                        $subscription_data = r_query("SELECT price, interval_period, interval_unit FROM subscriptions WHERE id = $1", $conditions);
                        $user_subscription_logs_post['subscription_start_date'] = date('Y-m-d H:i:s');
                        $user_subscription_logs_post['subscription_end_date'] = date('Y-m-d H:i:s', strtotime('+' . $subscription_data['interval_period'] . ' ' . $subscription_data['interval_unit']));
                        $user_subscription_logs_post['amount'] = $subscription_data['price'];
                        $user_subscription_logs_result = pg_execute_insert('user_subscription_logs', $user_subscription_logs_post);
                        // For updating total_spend in user table
                        _updateRevenue(null, $user_subscriptions['user_id']);
                    }
                } else {
                    // For other than PayPal, we insert a record in user_subscription_logs and called callCapture and update subscription_status_id = ConstSubscriptionStatuses::Active here
                    $conditions = array(
                        $get['user_subscription_logs_id'],
                        $post['id'],
                    );
                    $user_subscription_logs = r_query("SELECT count(id) FROM user_subscription_logs WHERE id = $1 AND sudopay_payment_id = $2", $conditions);
                    if (empty($user_subscription_logs['count'])) {
                        $user_subscription_logs_put['id'] = $get['user_subscription_logs_id'];
                        $user_subscription_logs_put['subscription_status_id'] = ConstSubscriptionStatuses::Active;;
                        $user_subscription_logs_put['sudopay_payment_id'] = $post['id'];
                        $user_subscription_logs_put['paykey'] = $post['paykey'];
                        $conditions = array(
                            $user_subscriptions['subscription_id']
                        );
                        $subscription_data = r_query("SELECT price, interval_period, interval_unit FROM subscriptions WHERE id = $1", $conditions);
                        $user_subscription_logs_put['subscription_start_date'] = date('Y-m-d H:i:s');
                        $user_subscription_logs_put['subscription_end_date'] = date('Y-m-d H:i:s', strtotime('+' . $subscription_data['interval_period'] . ' ' . $subscription_data['interval_unit']));
                        $user_subscription_logs_put['amount'] = $subscription_data['price'];
                        $result = pg_execute_update('user_subscription_logs', $user_subscription_logs_put);
                        // For updating total_spend in user table
                        if (!empty($user_subscriptions['user_id'])) {
                            _updateRevenue(null, $user_subscriptions['user_id']);
                        }
                    }
                }
            }
        } else if (!empty($post['status']) && $post['status'] != 'Captured' && $post['id'] != null) {
            $conditions = array(
                $post['x-user_subscription_id'],
                ConstSubscriptionStatuses::Active
            );
            $user_subscriptions = r_query("SELECT * FROM user_subscriptions WHERE id = $1 AND subscription_status_id = $2", $conditions);
            if (!empty($user_subscriptions)) {
                // To updating previous active records (other than this) to inactive (User have only one should be active at a time)
                updateSubscriptionPlansToCancel($user_subscriptions['user_id']);
            }
            $conditions = array(
                $post['id'],
                ConstSubscriptionStatuses::Active
            );
            $user_subscription_logs_data = r_query("SELECT * FROM user_subscription_logs WHERE sudopay_payment_id = $1 AND subscription_status_id = $2", $conditions);
            if (!empty($user_subscription_logs_data)) {
                $user_subscription_logs_put['id'] = $user_subscription_logs_data['id'];
                $user_subscription_logs_put['subscription_status_id'] = ConstSubscriptionStatuses::Canceled;
                $result = pg_execute_update('user_subscription_logs', $user_subscription_logs_put);
            }
        } else if (!empty($post['status']) && $post['status'] == 'Active') {
            $conditions = array(
                $post['user_handle'],
                ConstSubscriptionStatuses::Active
            );
            $user_subscriptions = r_query("SELECT id, user_id FROM user_subscriptions WHERE id = $1 AND subscription_status_id != $2", $conditions);
            if (!empty($user_subscriptions)) {
                // To updating previous active records (other than this) to inactive (User have only one should be active at a time)
                updateSubscriptionPlansToCancel($user_subscriptions['user_id']);
                $user_subscriptions_put['id'] = $user_subscriptions['id'];
                $user_subscriptions_put['subscription_status_id'] = ConstSubscriptionStatuses::Active;
                $user_subscriptions_put['sudopay_paypal_subscription_id'] = $post['subscription_id'];
                $result = pg_execute_update('user_subscriptions', $user_subscriptions_put);
                $user_subscription_logs_put['id'] = $get['user_subscription_logs_id'];
                $user_subscription_logs_put['subscription_status_id'] = ConstSubscriptionStatuses::Active;
                $result = pg_execute_update('user_subscription_logs', $user_subscription_logs_put);
                // For updating total_spend in user table
                if (!empty($user_subscriptions['user_id'])) {
                    _updateRevenue(null, $user_subscriptions['user_id']);
                }
            }
        } else if (!empty($post['status']) && $post['status'] != 'Active') {
            $conditions = array(
                $post['user_handle'],
                ConstSubscriptionStatuses::Active
            );
            $user_subscriptions = r_query("SELECT id FROM user_subscriptions WHERE id = $1 AND subscription_status_id = $2", $conditions);
            if (!empty($user_subscriptions)) {
                $user_subscriptions_put['id'] = $user_subscriptions['id'];
                $user_subscriptions_put['subscription_status_id'] = ConstSubscriptionStatuses::Canceled;
                $user_subscriptions_put['subscription_canceled_date'] = date('Y-m-d H:i:s');
                $result = pg_execute_update('user_subscriptions', $user_subscriptions_put);
            }
        }
    }
}
function updateSubscriptionPlansToCancel($user_id, $current_user_subcription_id = '')
{
    // Updating previous records to canceled status
    $updateData = array();
    $updateData[] = ConstSubscriptionStatuses::Canceled;
    $updateData[] = ConstSubscriptionStatuses::Active;
    $updateData[] = $user_id;
    $updateData[] = date('Y-m-d H:i:s');
    if (!empty($current_user_subcription_id)) {
        $updateData[] = $current_user_subcription_id;
        $sql_query = "UPDATE user_subscriptions SET subscription_status_id = $1, subscription_canceled_date = $4 WHERE subscription_status_id = $2 AND user_id = $3 AND id != $5";
    } else {
        $sql_query = "UPDATE user_subscriptions SET subscription_status_id = $1, subscription_canceled_date = $4  WHERE subscription_status_id = $2 AND user_id = $3";
    }
    $result = pg_execute_query($sql_query, $updateData);
    // Updating sub table to cancel status
    $conditions = array();
    $conditions[] = ConstSubscriptionStatuses::Canceled;
    $conditions[] = ConstSubscriptionStatuses::Active;
    $conditions[] = $user_id;
    if (!empty($current_user_subcription_id)) {
        $conditions[] = $current_user_subcription_id;
        $sql_query = "UPDATE user_subscription_logs SET subscription_status_id = $1 WHERE subscription_status_id = $2 AND user_id = $3 AND user_subscription_id != $4";
    } else {
        $sql_query = "UPDATE user_subscription_logs SET subscription_status_id = $1 WHERE subscription_status_id = $2 AND user_id = $3";
    }
    $result = pg_execute_query($sql_query, $conditions);
}
