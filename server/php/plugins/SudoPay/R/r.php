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
function SudoPay_r_get($passed_values)
{
    foreach ($passed_values as $key => $values) {
        $ {
            $key
        } = $values;
    }
    switch ($r_resource_cmd) {
    case '/sudopay_synchronize': // To sync sudopay
		// Including SudoPay vendor file
		require_once APP_PATH . DIRECTORY_SEPARATOR . 'server' . DIRECTORY_SEPARATOR . 'php' . DIRECTORY_SEPARATOR . 'plugins' . DIRECTORY_SEPARATOR . 'SudoPay' . DIRECTORY_SEPARATOR . 'sudopay.php';
        $message = '';
        $conditions = array(
            ConstSettingCategories::SudoPay
        );
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
		// Gateway call cache file only delete when admin sync
		$gateway_url = $s->api_url . '/merchants/' . $gateway_settings_options['payment.sudopay_merchant_id'] . '/websites/' . $gateway_settings_options['payment.sudopay_website_id'] . '/gateways' . '.json';
		$cache_path = dirname(dirname(dirname(dirname(__FILE__)))) . DIRECTORY_SEPARATOR . 'tmp' . DIRECTORY_SEPARATOR . 'cache' . DIRECTORY_SEPARATOR;
		$url_replace_arr = array(
			' ',
			'/',
			':',
			'?',
			'&',
			'$',
		);
		$filename_geteway = $cache_path . str_replace($url_replace_arr, '_', $gateway_url);
		@unlink($filename_geteway);
		$gateway_response = $s->callGateways();
		if (!empty($gateway_response['error']['message'])) {
			$message = $gateway_response['error']['message'];
			$res_status = false;
		}
		$conditions = array();
		$result = pg_execute_query('DELETE FROM sudopay_payment_gateways', $conditions);
		$enabled_gateways = array();
		if (empty($gateway_response['error']['message'])) {
			$i = 0;
			$res_status = true;
			foreach ($gateway_response['gateways'] as $key => $gateways) {
				foreach ($gateways['gateways'] as $keyval => $gateway) {
					$supported_actions = $gateway['supported_features'][0]['actions'];
					$is_marketplace_supported = 0;
					if (in_array('Marketplace-Auth', $supported_actions)) {
						$is_marketplace_supported = 1;
					}
					$enabled_gateways[$i]['is_marketplace_supported'] = $is_marketplace_supported;
					$enabled_gateways[$i]['sudopay_payment_group_id'] = $gateways['id'];
					$enabled_gateways[$i]['sudopay_gateway_id'] = $gateway['id'];
					$enabled_gateways[$i]['sudopay_gateway_details'] = serialize($gateway);
					$enabled_gateways[$i]['thumb_url'] = $gateway['thumb_url'];
					$enabled_gateways[$i]['sudopay_gateway_name'] = $gateway['display_name'];
					$enabled_gateways[$i]['name'] = $gateway['name'];
					$result = pg_execute_insert('sudopay_payment_gateways', $enabled_gateways[$i]);
					$enabled_gateways[$i]['supported_features']['actions'] = $gateway['supported_features'][0]['actions'];
					$enabled_gateways[$i]['supported_features']['currencies'] = $gateway['supported_features'][0]['currencies'];
					$i++;
				}
			}
		}
		$sql = '';
		$response = array(
			'error' => array(
				'code' => ($res_status) ? 0 : 1
			) ,
			'message' => $message
		);
        break;

    case '/sudopay_payment_gateways_users': // To get Sudopay payment gateways users listing with Filter
        if (!empty($r_resource_filters['q'])) {
            $conditions['OR']['name'] = strtolower($r_resource_filters['q']);
            $val_arr[] = '%' . strtolower($r_resource_filters['q']) . '%';
        }
        $where = getWhereCondition($conditions);
        $c_sql = "SELECT count(*) FROM sudopay_payment_gateways_users_listing" . $where;
        $sql = "SELECT row_to_json(d) FROM (SELECT $field FROM sudopay_payment_gateways_users_listing" . $where . " ORDER BY " . $sort . " " . $sort_by . ") as d ";
        break;

    case '/sudopay_payment_gateways': // To get sudopay payment gateway listing with Filter
        if (!empty($r_resource_filters['q'])) {
            $conditions['OR']['sudopay_gateway_name'] = strtolower($r_resource_filters['q']);
            $val_arr[] = '%' . strtolower($r_resource_filters['q']) . '%';
        }
        $where = getWhereCondition($conditions);
        if ($authUser['providertype'] == 'admin') {
            $c_sql = "SELECT count(*) FROM sudopay_payment_gateways" . $where;
            $sql = "SELECT row_to_json(d) FROM (SELECT $field FROM sudopay_payment_gateways" . $where . " ORDER BY " . $sort . " " . $sort_by . ") as d ";
        } else {
            $response['error'] = 1;
            $response['message'] = 'Authentication failed';
        }
        break;
    }
    $return_plugin['sort'] = $sort;
    if (!empty($c_sql)) {
        $return_plugin['c_sql'] = $c_sql;
    }
    if (!empty($sql)) {
        $return_plugin['sql'] = $sql;
    }
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
?>