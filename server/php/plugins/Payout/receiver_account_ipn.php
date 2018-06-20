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
require_once $app_path . 'libs' . DIRECTORY_SEPARATOR . 'core.php';
$sudopay_ipn_data['post_variable'] = serialize($_POST);
$sudopay_ipn_data['ip_id'] = r_saveIp();
$sudopay_ipn_data['ip_id'] = (!empty($sudopay_ipn_data['ip_id'])) ? $sudopay_ipn_data['ip_id'] : NULL;
$result = pg_execute_insert('ipn_logs', $sudopay_ipn_data);
$hash = $_GET['hash'];
$gateway_id = $_GET['gateway_id'];
$user_id = $_GET['user_id'];
if (!empty($hash) && !empty($gateway_id) && !empty($user_id)) {
    if ($hash == md5(ACE_SECRET_KEY . $gateway_id . $user_id . SITE_NAME)) {
        if (empty($_POST['error_code'])) {
            $conditions = array(
                $_GET['gateway_id'],
                $_GET['user_id']
            );
            $sudopay_payment_gateways_users_data = r_query("SELECT id FROM sudopay_payment_gateways_users WHERE sudopay_payment_gateway_id = $1 and user_id = $2", $conditions);
            if (empty($sudopay_payment_gateways_users_data)) {
                $sudopay_payment_gateways_users_post['sudopay_payment_gateway_id'] = $gateway_id;
                $sudopay_payment_gateways_users_post['user_id'] = $user_id;
                $result = pg_execute_insert('sudopay_payment_gateways_users', $sudopay_payment_gateways_users_post);
                $sudopay_data['sudopay_receiver_account_id'] = $_POST['id'];
                $sudopay_data['id'] = $user_id;
                $result = pg_execute_update('users', $sudopay_data);
            }
        }
    }
}
?>