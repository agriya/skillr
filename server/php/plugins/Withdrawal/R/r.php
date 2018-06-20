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
function Withdrawal_r_get($passed_values)
{
    foreach ($passed_values as $key => $values) {
        $ {
            $key
        } = $values;
    }
    switch ($r_resource_cmd) {
    case '/money_transfer_accounts': // To get money transfer accounts
        if ($authUser['providertype'] != 'admin') {
            $conditions['user_id'] = 'AND';
            $val_arr[] = $authUser['id'];
        }
        if (!empty($r_resource_filters['q'])) {
            $conditions['OR']['account'] = strtolower($r_resource_filters['q']);
            $val_arr[] = '%' . strtolower($r_resource_filters['q']) . '%';
        }
        $where = getWhereCondition($conditions);
        $c_sql = "SELECT count(*) FROM money_transfer_accounts" . $where;
        $sql = "SELECT row_to_json(d) FROM (SELECT $field FROM money_transfer_accounts" . $where . " ORDER BY " . $sort . " " . $sort_by . ") as d ";
        break;

    case '/user_cash_withdrawals': // To get user cash withdrawals
        if (!empty($r_resource_filters['filter'])) {
            if ($r_resource_filters['filter'] == 'Pending') {
                $conditions['withdrawal_status_id'] = 'AND';
                $val_arr[] = 1;
            } else if ($r_resource_filters['filter'] == 'Under Process') {
                $conditions['withdrawal_status_id'] = 'AND';
                $val_arr[] = 2;
            } else if ($r_resource_filters['filter'] == 'Rejected') {
                $conditions['withdrawal_status_id'] = 'AND';
                $val_arr[] = 3;
            } else if ($r_resource_filters['filter'] == 'Amount Transferred') {
                $conditions['withdrawal_status_id'] = 'AND';
                $val_arr[] = 4;
            }
        }
        if (!empty($r_resource_filters['q'])) {
            $conditions['OR']['withdrawal_status_name'] = strtolower($r_resource_filters['q']);
            $conditions['OR']['money_transfer_account_name'] = strtolower($r_resource_filters['q']);
            $val_arr[] = '%' . strtolower($r_resource_filters['q']) . '%';
            $val_arr[] = '%' . strtolower($r_resource_filters['q']) . '%';
        }
        if ($authUser['providertype'] != 'admin') {
            $conditions['user_id'] = 'AND';
            $val_arr[] = $authUser['id'];
        }
        $where = getWhereCondition($conditions);
        $c_sql = "SELECT count(*) FROM user_cash_withdrawals_listing" . $where;
        $sql = "SELECT row_to_json(d) FROM (SELECT $field FROM user_cash_withdrawals_listing" . $where . " ORDER BY " . $sort . " " . $sort_by . ") as d ";
        break;

    case '/money_transfer_accounts/?': // To get particular transactions detail based on Id
        $val_arr[] = $r_resource_vars['money_transfer_accounts'];
        $field = "id,user_id,account";
        $money_transfer_accounts = r_query("SELECT user_id FROM money_transfer_accounts WHERE id = $1", $val_arr);
        if (!empty($authUser) && ($authUser['providertype'] == "admin")) {
            $c_sql = "SELECT count(*) FROM money_transfer_accounts WHERE id = $1";
            $sql = "SELECT row_to_json(d) FROM (SELECT $field FROM money_transfer_accounts WHERE id = $1) as d ";
        } else {
            $response['error'] = 1;
            $response['message'] = 'Authentication failed';
        }
        break;

    case '/user_cash_withdrawals/?': // To get particular user cash withdrawals detail based on Id
        $val_arr[] = $r_resource_vars['user_cash_withdrawals'];
        $field = "id,user_id,withdrawal_status_id,amount";
        $user_cash_withdrawals = r_query("SELECT user_id FROM user_cash_withdrawals WHERE id = $1", $val_arr);
        if (!empty($authUser) && ($authUser['providertype'] == "admin")) {
            $c_sql = "SELECT count(*) FROM user_cash_withdrawals WHERE id = $1";
            $sql = "SELECT row_to_json(d) FROM (SELECT $field FROM user_cash_withdrawals WHERE id = $1) as d ";
        } else {
            $response['error'] = 1;
            $response['message'] = 'Authentication failed';
        }
        break;

    case '/withdrawal_statuses': // To get withdrawal statuses with Filter
        if (!empty($r_resource_filters['q'])) {
            $conditions['OR']['name'] = strtolower($r_resource_filters['q']);
            $val_arr[] = '%' . strtolower($r_resource_filters['q']) . '%';
        }
        $where = getWhereCondition($conditions);
        $c_sql = "SELECT count(*) FROM withdrawal_statuses" . $where;
        $sql = "SELECT row_to_json(d) FROM (SELECT $field FROM withdrawal_statuses" . $where . " ORDER BY " . $sort . " " . $sort_by . ") as d ";
        break;

    case '/withdrawal_statuses/?': // To get particular withdrawal statuses detail based on Id
        $val_arr[] = $r_resource_vars['withdrawal_statuses'];
        $c_sql = "SELECT count(*) FROM withdrawal_statuses WHERE id = $1";
        $sql = "SELECT row_to_json(d) FROM (SELECT $field FROM withdrawal_statuses WHERE id = $1) as d ";
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
function Withdrawal_r_post($passed_values)
{
    foreach ($passed_values as $key => $values) {
        $ {
            $key
        } = $values;
    }
    $course_owner = array();
    $course_owner['user_id'] = '';
    switch ($r_resource_cmd) {
    case '/money_transfer_accounts': // To add money transfer accounts details
        $table_name = 'money_transfer_accounts';
        $r_post['user_id'] = $authUser['id'];
        $sql = true;
        break;

    case '/user_cash_withdrawals': // To add user cash withdrawals details
        $sql = false;
        $conditions = array(
            $authUser['id'],
            1
        );
        $course_user = r_query("SELECT id FROM user_cash_withdrawals WHERE user_id = $1 and withdrawal_status_id =$2", $conditions);
        if (empty($course_user)) {
            if ($r_post['amount'] <= $authUser['available_balance']) {
                $table_name = 'user_cash_withdrawals';
                $r_post['user_id'] = $authUser['id'];
                $r_post['withdrawal_status_id'] = 1;
                $sql = true;
                break;
            } else {
                $response['error']['code'] = 1;
                $response['error']['message'] = "You Dont have sufficient amount in your wallet.";
            }
        } else {
            $response['error']['code'] = 2;
            $response['error']['message'] = "Your previous withdraw request is in pending status. So you can't request now.";
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
function Withdrawal_r_delete($passed_values)
{
    foreach ($passed_values as $key => $values) {
        $ {
            $key
        } = $values;
    }
    switch ($r_resource_cmd) {
    case '/money_transfer_accounts/?': // To delete money transfer accounts details based on Id
        $val_arr[] = $r_resource_vars['money_transfer_accounts'];
        $conditions = array(
            $r_resource_vars['money_transfer_accounts'],
            ConstWithdrawalStatuses::Pending,
            ConstWithdrawalStatuses::UnderProcess
        );
        $user_cash_withdrawal = r_query("SELECT id FROM user_cash_withdrawals WHERE money_transfer_account_id = $1 AND withdrawal_status_id =  $2 or withdrawal_status_id = $3", $conditions);
        if (empty($user_cash_withdrawal)) {
            $money_transfer_accounts = r_query("SELECT user_id FROM money_transfer_accounts WHERE id = $1", $val_arr);
            if ($authUser['providertype'] == 'admin' || $authUser['id'] == $money_transfer_accounts['user_id']) {
                $sql = "DELETE FROM money_transfer_accounts WHERE id = $1";
            } else {
                $result['error'] = "Authentication failed";
            }
        } else {
            $response['error']['code'] = 1;
            $response['error']['message'] = "One of your withdrawal request is in pending status,So you can't delete this now.";
        }
        break;

    case '/user_cash_withdrawals/?': // To delete user cash withdrawals details based on Id
        $val_arr[] = $r_resource_vars['user_cash_withdrawals'];
        if ($authUser['providertype'] == 'admin') {
            $sql = "DELETE FROM user_cash_withdrawals WHERE id = $1";
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
    if (!empty($response)) {
        $return_plugin['response'] = $response;
    }
    return $return_plugin;
}
function Withdrawal_r_put($passed_values)
{
    foreach ($passed_values as $key => $values) {
        $ {
            $key
        } = $values;
    }
    switch ($r_resource_cmd) {
    case '/user_cash_withdrawals/?': // To updateuser cash withdrawals details based on Id
        $table_name = 'user_cash_withdrawals';
        $r_put['id'] = $r_resource_vars['user_cash_withdrawals'];
        // From ng-admin - multiple assignments to same column \"modified\" - raised so unsetted here
        if (!empty($r_put['modified'])) {
            unset($r_put['modified']);
        }
        if ($authUser['providertype'] == 'admin') {
            $sql = true;
            $conditions = array(
                $r_put['id']
            );
            $user_cash_withdrawals = r_query("SELECT * FROM user_cash_withdrawals WHERE id = $1", $conditions);
            if ($r_put['withdrawal_status_id'] == $user_cash_withdrawals['withdrawal_status_id']) {
                // Avoiding duplicated amount deduction in available balance // handing in main r.php
                $user_cash_withdrawals = array();
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
    if (!empty($user_cash_withdrawals)) {
        $plugin_return['user_cash_withdrawals'] = $user_cash_withdrawals;
    }
    if (!empty($response)) {
        $return_plugin['response'] = $response;
    }
    return $plugin_return;
}
?>