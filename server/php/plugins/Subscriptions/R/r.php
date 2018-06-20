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
function Subscriptions_r_get($passed_values)
{
    foreach ($passed_values as $key => $values) {
        $ {
            $key
        } = $values;
    }
    switch ($r_resource_cmd) {
    case '/subscriptions': // To get subscriptions listing with Filters
        if ((!empty($authUser) && ($authUser['providertype'] == 'userpass' || ($authUser['providertype'] == 'admin' && empty($r_resource_filters['filter'])))) || empty($authUser)) {
            // For front end users - should display only active user list
            // Case 1: logged in && front end user
            // Case 2: logged in && admin user and not set filter
            // Case 3: Guest Users
            $conditions['is_active'] = 't';
            $val_arr[] = 't';
        } else {
            // for admin end code // have various filter options and option to display all active/inactive users
            if (!empty($r_resource_filters['filter']) && $r_resource_filters['filter'] != 'all') {
                if ($r_resource_filters['filter'] == 'active') {
                    $conditions['is_active'] = 't';
                    $val_arr[] = 't';
                } else if ($r_resource_filters['filter'] == 'inactive') {
                    $conditions['is_active'] = 'f';
                    $val_arr[] = 'f';
                }
            }
        }
        if (!empty($r_resource_filters['q'])) {
            $conditions['OR']['name'] = strtolower($r_resource_filters['q']);
            $val_arr[] = '%' . strtolower($r_resource_filters['q']) . '%';
        }
        $where = getWhereCondition($conditions);
        $sort = 'id';
        $sort_by = 'ASC';
        $c_sql = "SELECT count(*) FROM subscriptions" . $where;
        $sql = "SELECT row_to_json(d) FROM (SELECT $field FROM subscriptions" . $where . " ORDER BY " . $sort . " " . $sort_by . ") as d ";
        break;

    case '/subscriptions/?': // To get particular subscription detail based on Id
        if ($authUser['providertype'] == 'admin' || !empty($authUser)) {
            $val_arr[] = $r_resource_vars['subscriptions'];
            $c_sql = "SELECT count(*) FROM subscriptions WHERE id = $1";
            $sql = "SELECT row_to_json(d) FROM (SELECT $field FROM subscriptions WHERE id = $1) as d ";
        } else {
            $response['error'] = 1;
            $response['message'] = 'Authentication failed';
        }
        break;

    case '/user_subscriptions': // To get user subscription logs listing with Filters
        $conditions['user_id'] = 'AND';
        $val_arr[] = $authUser['id'];
        $conditions['subscription_status_id'] = 'AND';
        $val_arr[] = ConstSubscriptionStatuses::Active;
        $where = getWhereCondition($conditions);
        $c_sql = "SELECT count(*) FROM user_subscriptions" . $where;
        $sql = "SELECT row_to_json(d) FROM (SELECT $field FROM user_subscriptions" . $where . " ORDER BY " . $sort . " " . $sort_by . ") as d ";
        break;

    case '/user_subscription_logs': // To get user subscription logs listing with Filters
        if (!empty($r_resource_filters['q'])) {
            $conditions['OR']['name'] = strtolower($r_resource_filters['q']);
            $val_arr[] = '%' . strtolower($r_resource_filters['q']) . '%';
        }
        $where = getWhereCondition($conditions);
        $c_sql = "SELECT count(*) FROM user_subscription_logs" . $where;
        $sql = "SELECT row_to_json(d) FROM (SELECT $field FROM user_subscription_logs" . $where . " ORDER BY " . $sort . " " . $sort_by . ") as d ";
        break;

    case '/user_subscription_logs/?': // To get particular user subscription log detail based on Id
        $sort = 'id';
        $sort_by = 'desc';
        if ($authUser['providertype'] == 'admin' || !empty($authUser)) {
            $val_arr[] = $r_resource_vars['user_subscription_logs'];
            $c_sql = "SELECT count(*) FROM user_subscription_logs WHERE id = $1 AND subscription_status_id != " . ConstSubscriptionStatuses::Initiated;
            $sql = "SELECT row_to_json(d) FROM (SELECT usl.$field, s.name FROM user_subscription_logs usl left join user_subscriptions us on (usl.user_subscription_id = us.id) left join subscriptions s on (us.subscription_id = s.id ) WHERE usl.id = $1 AND usl.subscription_status_id != " . ConstSubscriptionStatuses::Initiated . " ORDER BY usl." . $sort . " " . $sort_by . ") as d ";
        } else {
            $response['error'] = 1;
            $response['message'] = 'Authentication failed';
        }
        break;

    case '/users/?/user_subscription_logs': // To get particular user's subscription log details
        $sort = 'id';
        $sort_by = 'desc';
        if ($authUser['providertype'] == 'admin' || !empty($authUser)) {
            $val_arr[] = $r_resource_vars['users'];
            $c_sql = "SELECT count(*) FROM user_subscription_logs WHERE user_id = $1 AND subscription_status_id != " . ConstSubscriptionStatuses::Initiated;
            $sql = "SELECT row_to_json(d) FROM (SELECT usl.id, to_char(usl.created, 'YYYY-MM-DD HH24:MI:SS') as created, to_char(usl.subscription_start_date, 'YYYY-MM-DD HH24:MI:SS') as start_date, to_char(usl.subscription_end_date, 'YYYY-MM-DD HH24:MI:SS') as end_date, to_char(us.subscription_canceled_date, 'YYYY-MM-DD HH24:MI:SS') as canceled_date, usl.amount, s.name, ss.name as status_name FROM user_subscription_logs usl left join user_subscriptions us on (usl.user_subscription_id = us.id) left join subscriptions s on (us.subscription_id = s.id ) left join subscription_statuses ss on (usl.subscription_status_id = ss.id ) WHERE usl.user_id = $1 AND usl.subscription_status_id != " . ConstSubscriptionStatuses::Initiated . " ORDER BY usl." . $sort . " " . $sort_by . ") as d ";
        } else {
            $response['error'] = 1;
            $response['message'] = 'Authentication failed';
        }
        break;

    case '/me/subscriptions':
        $conditions['user_id'] = 'AND';
        $val_arr[] = $authUser['id'];
        $conditions['subscription_status_id'] = 'AND';
        $val_arr[] = ConstSubscriptionStatuses::Active;
        $count_val_arr_restrict = 1;
        $c_sql = "SELECT count(*) FROM subscriptions s";
        $sql = "SELECT row_to_json(d) FROM (SELECT s.*, CASE WHEN ((select us.id from user_subscriptions us where us.subscription_id = s.id and user_id = $1 AND subscription_status_id = $2 AND is_cancel_requested != 1 OFFSET 0 LIMIT 1) > 0) THEN 'true' ELSE 'false' END AS is_current_plan, (select us.id from user_subscriptions us where us.subscription_id = s.id and user_id = $1 AND subscription_status_id = $2 AND is_cancel_requested != 1 order by id desc OFFSET 0 LIMIT 1) AS current_plan_id FROM subscriptions s WHERE s.is_active = 't') as d ";
        break;

    case '/subscription_statuses': // To get particular subscription detail based on Id
        $c_sql = "SELECT count(*) FROM subscription_statuses";
        $sql = "SELECT row_to_json(d) FROM (SELECT $field FROM subscription_statuses ORDER BY " . $sort . " " . $sort_by . ") as d ";
        break;

    case '/subscription_statuses/?': // To get particular subscription detail based on Id
        $val_arr[] = $r_resource_vars['subscription_statuses'];
        $c_sql = "SELECT count(*) FROM subscription_statuses WHERE id = $1";
        $sql = "SELECT row_to_json(d) FROM (SELECT $field FROM subscription_statuses WHERE id = $1) as d ";
        break;
    }
    $return_plugin['sort'] = $sort;
    $return_plugin['sql'] = $sql;
    $return_plugin['c_sql'] = $c_sql;
    $return_plugin['field'] = $field;
    $return_plugin['sort_by'] = $sort_by;
    $return_plugin['query_timeout'] = $query_timeout;
    $return_plugin['limit'] = $limit;
    $return_plugin['conditions'] = $conditions;
    $return_plugin['val_arr'] = $val_arr;
    if (!empty($response)) {
        $return_plugin['response'] = $response;
    }
    if (!empty($count_val_arr_restrict)) {
        $return_plugin['count_val_arr_restrict'] = $count_val_arr_restrict;
    }
    return $return_plugin;
}
function Subscriptions_r_post($passed_values)
{
    foreach ($passed_values as $key => $values) {
        $ {
            $key
        } = $values;
    }
    $course_owner = array();
    $course_owner['user_id'] = '';
    switch ($r_resource_cmd) {
    case '/subscriptions/payment': // To subscribe payment with Sudopay payment gateways based on Course Id
        $subscription_id = $r_post['subscription_id'];
        $user_id = $authUser['id'];
        $currencycode = $siteCurrencyCode[0]['value'];
        if (!empty($r_post['sudopay_gateway_id'])) {
            require_once APP_PATH . DIRECTORY_SEPARATOR . 'server' . DIRECTORY_SEPARATOR . 'php' . DIRECTORY_SEPARATOR . 'plugins' . DIRECTORY_SEPARATOR . 'SudoPay' . DIRECTORY_SEPARATOR . 'functions.php';
            // Function calling in SudoPay Plugin functions.php file
            $response = makeSudoPayRequestForSubscriptionPayment($subscription_id, $user_id, $currencycode, $r_post);
        } else if (!empty($r_post['paypal_gateway_enabled'])) {
            require_once APP_PATH . DIRECTORY_SEPARATOR . 'server' . DIRECTORY_SEPARATOR . 'php' . DIRECTORY_SEPARATOR . 'plugins' . DIRECTORY_SEPARATOR . 'PayPal' . DIRECTORY_SEPARATOR . 'functions.php';
            // Function calling in SudoPay Plugin functions.php file
            $response = makePayPalRequestForSubscriptionPayment($subscription_id, $user_id, $currencycode, $r_post);
        }
        $sql = false;
        break;

    case '/subscriptions': // To add the subscriptions
        if ($authUser['providertype'] == 'admin') {
            $table_name = 'subscriptions';
            $sql = true;
            $instruction_levels = array();
            if (!empty($r_post['instruction_levels'])) {
                $instruction_levels = $r_post['instruction_levels'];
                unset($r_post['instruction_levels']);
            }
        } else {
            $response['error']['code'] = 1;
            $response['error']['message'] = "Authentication Failed";
        }
        break;

    case '/user_subscription_logs': // To add the user subscription logs
        if ($authUser['providertype'] == 'admin') {
            $table_name = 'user_subscription_logs';
            $sql = true;
        } else {
            $response['error']['code'] = 1;
            $response['error']['message'] = "Authentication Failed";
        }
        break;

    case '/user_subscriptions': // To add the user subscriptions
        if ($authUser['providertype'] == 'admin') {
            $table_name = 'user_subscriptions';
            $sql = true;
        } else {
            $response['error']['code'] = 1;
            $response['error']['message'] = "Access Denied";
        }
        break;
    }
    $return_plugin['sql'] = $sql;
    if (!empty($table_name)) {
        $return_plugin['table_name'] = $table_name;
    }
    if (!empty($siteCurrencyCode)) {
        $return_plugin['siteCurrencyCode'] = $siteCurrencyCode;
    }
    if (!empty($instruction_levels)) {
        $return_plugin['instruction_levels'] = $instruction_levels;
    }
    $return_plugin['r_post'] = $r_post;
    if (!empty($response)) {
        $return_plugin['response'] = $response;
    }
    return $return_plugin;
}
function Subscriptions_r_put($passed_values)
{
    foreach ($passed_values as $key => $values) {
        $ {
            $key
        } = $values;
    }
    switch ($r_resource_cmd) {
    case '/subscriptions/?': // To update subscription details based on Id
        $r_put['id'] = $r_resource_vars['subscriptions'];
        if (!empty($r_put['modified'])) {
            unset($r_put['modified']);
        }
        if (!empty($authUser) && $authUser['providertype'] == 'admin') {
            $sql = true;
            $table_name = 'subscriptions';
            $instruction_levels = array();
            if (!empty($r_put['instruction_levels'])) {
                $instruction_levels = $r_put['instruction_levels'];
                unset($r_put['instruction_levels']);
            }
        } else {
            $response['error']['code'] = 1;
            $response['error']['message'] = 'Authentication failed';
        }
        break;

    case '/user_subscription_logs/?': // To update user subscription log details based on Id
        $table_name = 'user_subscription_logs';
        $r_put['id'] = $r_resource_vars['user_subscription_logs'];
        $fields = array(
            'id',
            'subscription_id',
            'subscription_start_date',
            'subscription_end_date',
            'amount',
            'subscription_status_id'
        );
        $put_values = $r_put;
        $r_put = array();
        foreach ($put_values as $key => $value) {
            if (in_array(trim($key) , $fields)) {
                $r_put[$key] = $value;
            }
        }
        // Before updating previous records need to keep for checking - status changed?
        $conditions[] = $r_resource_vars['user_subscription_logs'];
        if (!empty($r_put['subscription_status_id'])) {
            $original_user_subscription_log = pg_query_cache("SELECT subscription_status_id, user_subscription_id FROM user_subscription_logs WHERE id = $1 LIMIT 1", $conditions);
        }
        $sql = true;
        break;

    case '/user_subscriptions/?': // To update user_subscriptions  details based on Id
        $table_name = 'user_subscriptions';
        $r_put['id'] = $r_resource_vars['user_subscriptions'];
        if ($authUser['providertype'] == 'admin' || !empty($authUser)) {
            $conditions = array(
                $r_put['id'],
                ConstSubscriptionStatuses::Active
            );
            $user_subscription = r_query("SELECT user_id, payment_gateway_id, sudopay_gateway_id, sudopay_paypal_subscription_id, paypal_subscr_id FROM user_subscriptions WHERE id = $1 AND subscription_status_id = $2", $conditions);
            if (!empty($user_subscription)) {
                if ($authUser['providertype'] == 'admin' || $user_subscription['user_id'] == $authUser['id']) {
                    $allowUpdate = true;
                    if ($user_subscription['payment_gateway_id'] == ConstPaymentGateways::SudoPay && $user_subscription['sudopay_gateway_id'] == 1) {
                        // Including SudoPay vendor file
                        require_once APP_PATH . DIRECTORY_SEPARATOR . 'server' . DIRECTORY_SEPARATOR . 'php' . DIRECTORY_SEPARATOR . 'plugins' . DIRECTORY_SEPARATOR . 'SudoPay' . DIRECTORY_SEPARATOR . 'sudopay.php';
                        $conditions = array(
                            4
                        );
                        $gateway_settings_options = array();
                        $settings = pg_query_cache("SELECT * FROM settings WHERE setting_category_id = $1 order by display_order", $conditions);
                        if (!empty($settings)) {
                            foreach ($settings as $value) {
                                $gateway_settings_options[$value['name']] = $value['value'];
                            }
                        }
                        $s = new SudoPay_API(array(
                            'api_key' => !empty($gateway_settings_options['payment.sudopay_api_key']) ? $gateway_settings_options['payment.sudopay_api_key'] : '',
                            'merchant_id' => !empty($gateway_settings_options['payment.sudopay_merchant_id']) ? $gateway_settings_options['payment.sudopay_merchant_id'] : '',
                            'website_id' => !empty($gateway_settings_options['payment.sudopay_website_id']) ? $gateway_settings_options['payment.sudopay_website_id'] : '',
                            'secret_string' => !empty($gateway_settings_options['payment.sudopay_secret_string']) ? $gateway_settings_options['payment.sudopay_secret_string'] : '',
                            'is_test' => !empty($gateway_settings_options['payment.is_live_mode']) ? 0 : 1 //Reverse is_live_mode = 1 mean is_test should be assign to 0
                            
                        ));
                        $SudoPayResponse = $s->callCancelPayPalSubscription($user_subscription['sudopay_paypal_subscription_id']);
                        if (!empty($SudoPayResponse['status']) && $SudoPayResponse['status'] == "success") {
                            $allowUpdate = true;
                            $response['error']['code'] = 0;
                            $response['error']['message'] = 'Success';
                        } else {
                            $allowUpdate = false;
                        }
                    } else if ($user_subscription['payment_gateway_id'] == ConstPaymentGateways::PayPal && !empty($user_subscription['paypal_subscr_id'])) {
                        require_once APP_PATH . DIRECTORY_SEPARATOR . 'server' . DIRECTORY_SEPARATOR . 'php' . DIRECTORY_SEPARATOR . 'plugins' . DIRECTORY_SEPARATOR . 'PayPal' . DIRECTORY_SEPARATOR . 'functions.php';
                        // Function calling in PayPal Plugin functions.php file
                        $response = makePayPalSubscriptionCancelRequest($user_subscription['paypal_subscr_id']);
                        //	$response = makePayPalSubscriptionCancelRequest('I-F0DJW8WUHWFX'); @boopathi
                        
                    }
                    if ($allowUpdate) {
                        $data = array(
                            date('Y-m-d H:i:s') ,
                            1,
                            $r_put['id']
                        );
                        $result = pg_execute_query("UPDATE user_subscriptions SET (modified, is_cancel_requested, subscription_canceled_date) = ($1, $2, $1) WHERE id = $3", $data);
                    } else {
                        $response['error']['code'] = 1;
                        $response['error']['message'] = "Problem in unsubscribe.";
                        echo json_encode($response);
                        exit;
                    }
                }
            }
            break;
        } else {
            $response['error']['code'] = 1;
            $response['error']['message'] = 'Authentication failed';
        }
        break;
    }
    if (!empty($instruction_levels)) {
        $plugin_return['instruction_levels'] = $instruction_levels;
    }
    $plugin_return['sql'] = $sql;
    $plugin_return['table_name'] = $table_name;
    $plugin_return['r_put'] = $r_put;
    if (!empty($original_user_subscription_log)) {
        $plugin_return['original_user_subscription_log'] = $original_user_subscription_log;
    }
    if (!empty($response)) {
        $return_plugin['response'] = $response;
    }
    return $plugin_return;
}
function Subscriptions_r_delete($passed_values)
{
    foreach ($passed_values as $key => $values) {
        $ {
            $key
        } = $values;
    }
    switch ($r_resource_cmd) {
    case '/subscriptions/?': // To delete subscription details based on Id
        if ($authUser['providertype'] == 'admin') {
            $val_arr[] = $r_resource_vars['subscriptions'];
            $sql = "DELETE FROM subscriptions WHERE id = $1";
        } else {
            $result['error'] = "Authentication failed";
        }
        break;

    case '/user_subscription_logs/?': // To delete user subscription logs details based on Id
        if ($authUser['providertype'] == 'admin') {
            $val_arr[] = $r_resource_vars['user_subscription_logs'];
            $sql = "DELETE FROM user_subscription_logs WHERE id = $1";
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