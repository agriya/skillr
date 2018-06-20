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
require_once $app_path . 'libs' . DIRECTORY_SEPARATOR . 'Inflector.php';
require_once APP_PATH . DIRECTORY_SEPARATOR . 'server' . DIRECTORY_SEPARATOR . 'php' . DIRECTORY_SEPARATOR . 'plugins' . DIRECTORY_SEPARATOR . 'SudoPay' . DIRECTORY_SEPARATOR . 'sudopay.php';
/**
 * Return credit card type if number is valid
 * @return string
 * @param $number string
 *
 */
// Ref: http://ulaptech.blogspot.in/2013/12/php-detect-credit-card-type-and.html
function cardType($number)
{
    $number = preg_replace('/[^\d]/', '', $number);
    if (preg_match('/^3[47][0-9]{13}$/', $number)) return 'American Express';
    elseif (preg_match('/^3(?:0[0-5]|[68][0-9])[0-9]{11}$/', $number)) return 'Diners Club';
    elseif (preg_match('/^6(?:011|5[0-9][0-9])[0-9]{12}$/', $number)) return 'Discover';
    elseif (preg_match('/^(?:2131|1800|35\d{3})\d{11}$/', $number)) return 'JCB';
    elseif (preg_match('/^5[1-5][0-9]{14}$/', $number)) return 'MasterCard';
    elseif (preg_match('/^4[0-9]{12}(?:[0-9]{3})?$/', $number)) return 'Visa';
    else if (preg_match("/^3[47]\d{13}$/", $number)) return 'AMEX';
    else if (preg_match("/^2(014|149)\d{11}$/", $number)) return 'ENROUTE';
    else return 'Unknown';
}
function makeSudoPayRequestForPayment($course_id, $user_id, $currencycode, $r_post)
{
	$inflector = new Inflector();
    $amount = 0;
    $buyer_fees_payer_confirmation_token = '';
    $site_commission_percentage = 0;
    $conditions = array(
        $course_id,
        $user_id
    );
    $course_user_data = r_query("SELECT id FROM course_users WHERE course_id = $1 and user_id = $2", $conditions);
    if (empty($course_user_data)) {
        $course_user_post['course_id'] = $course_id;
        $course_user_post['user_id'] = $user_id;
        $course_user_post['course_user_status_id'] = ConstCourseUserStatuses::PaymentPending;
        $course_user_post['payment_gateway_id'] = ConstPaymentGateways::SudoPay;
        $result = pg_execute_insert('course_users', $course_user_post);
        $course_user_data['id'] = $result['id'];
    }
    $conditions = array(
        $course_id
    );
    $course_data = r_query("SELECT price,title FROM courses WHERE id = $1", $conditions);
    if (!empty($course_data)) {
        $amount = $course_data['price'];
    }
	$pluginConditions = array(
		'site.enabled_plugins'
	);
    $gateway_exist = false;
	$enabledPlugins = pg_query_cache("SELECT value FROM settings WHERE name = $1 order by display_order", $pluginConditions);
	if(!empty($enabledPlugins[0]['value']) && strpos($enabledPlugins[0]['value'], 'Payout') !== false) {
		$gateways = array();
		$conditions = array(
			$course_id
		);
		$gateways_list = pg_query_cache("SELECT sg.sudopay_payment_gateway_id FROM courses c inner join sudopay_payment_gateways_users sg on sg.user_id = c.user_id WHERE c.id = $1", $conditions);
		foreach ($gateways_list as $gateway) {
			$gateways[] = $gateway['sudopay_payment_gateway_id'];
		}
		if (in_array($r_post['gateway_id'], $gateways)) {
			$gateway_exist = true;
		}
		$sudopay_receiver_account_id = '';
		$conditions = array(
			$course_id
		);
		$user_data = r_query("SELECT u.sudopay_receiver_account_id, c.user_id as teacher_user_id FROM courses c left join users u on u.id = c.user_id WHERE c.id = $1", $conditions);
		if (!empty($user_data)) {
			$sudopay_receiver_account_id = $user_data['sudopay_receiver_account_id'];
		}
	}
    $conditions = array(
        'site.currency_code',
        'revenue.commission_percentage'
    );
    $settings_data = pg_query_cache("SELECT value FROM settings WHERE name in ($1, $2) order by id", $conditions);
    if (!empty($settings_data)) {
        $site_commission_percentage = $settings_data['0']['value'];
        $currencycode = $settings_data['1']['value'];
    }
    $sudopay_post_variable['amount'] = $amount;
    $sudopay_post_variable['currency_code'] = $currencycode;
    $site_fee = $amount * ($site_commission_percentage / 100);
    if (!empty($r_post['gateway_id'])) {
        $sudopay_post_variable['gateway_id'] = $r_post['gateway_id'] = str_replace('sp_', '', $r_post['gateway_id']);
    }
    $conditions = array(
        $r_post['gateway_id']
    );
    $gatway_data = r_query("SELECT * FROM sudopay_payment_gateways WHERE sudopay_gateway_id = $1", $conditions);
    if (!empty($gatway_data)) {
        $data = unserialize($gatway_data['sudopay_gateway_details']);
        $buyer_fees_payer_confirmation_token = $data['buyer_fees_payer_confirmation_token'];
    }
    $conditions = array(
        ConstSettingCategories::SudoPay
    );
    $gateway_settings_options = array();
    $settings = pg_query_cache("SELECT * FROM settings WHERE setting_category_id = $1 order by display_order", $conditions);
    if (!empty($settings)) {
        foreach ($settings as $value) {
            $gateway_settings_options[$value['name']] = $value['value'];
        }
    }
    $hash = md5(ACE_SECRET_KEY . $course_user_data['id'] . SITE_NAME);
    // Setting buyer information to post SudoPay
    if (!empty($r_post['buyer_email'])) {
        $sudopay_post_variable['buyer_email'] = $r_post['buyer_email'];
    }
    if (!empty($r_post['buyer_address'])) {
        $sudopay_post_variable['buyer_address'] = $r_post['buyer_address'];
    }
    if (!empty($r_post['buyer_city'])) {
        $sudopay_post_variable['buyer_city'] = $r_post['buyer_city'];
    }
    if (!empty($r_post['buyer_state'])) {
        $sudopay_post_variable['buyer_state'] = $r_post['buyer_state'];
    }
    if (!empty($r_post['buyer_country'])) {
        $sudopay_post_variable['buyer_country'] = $r_post['buyer_country'];
    }
    if (!empty($r_post['buyer_zip_code'])) {
        $sudopay_post_variable['buyer_zip_code'] = $r_post['buyer_zip_code'];
    }
    if (!empty($r_post['buyer_phone'])) {
        $sudopay_post_variable['buyer_phone'] = $r_post['buyer_phone'];
    }
    // Setting CC information to post SudoPay
    if (!empty($r_post['credit_card_number'])) {
        $sudopay_post_variable['credit_card_number'] = $r_post['credit_card_number'];
    }
    if (!empty($r_post['credit_card_expire'])) {
        $sudopay_post_variable['credit_card_expire'] = $r_post['credit_card_expire'];
    }
    if (!empty($r_post['credit_card_name_on_card'])) {
        $sudopay_post_variable['credit_card_name_on_card'] = $r_post['credit_card_name_on_card'];
    }
    if (!empty($r_post['credit_card_code'])) {
        $sudopay_post_variable['credit_card_code'] = $r_post['credit_card_code'];
    }
    // Setting Manual payment information to post SudoPay
    if (!empty($r_post['payment_note'])) {
        $sudopay_post_variable['payment_note'] = $r_post['payment_note'];
    }
    $sudopay_post_variable['success_url'] = getSiteUri() . '/#!/course/' . $course_id . '/' . $inflector->slug($course_data['title'], '-') . '&error_code=0';
    $sudopay_post_variable['cancel_url'] = getSiteUri() . '/#!/course/' . $course_id . '/' . $inflector->slug($course_data['title'], '-') . '&error_code=512';
    $sudopay_post_variable['notify_url'] = getSiteUri() . '/ipn/process_ipn/' . $course_user_data['id'] . '/hash/' . $hash;
    $sudopay_post_variable['merchant_id'] = $gateway_settings_options['payment.sudopay_merchant_id'];
    $sudopay_post_variable['website_id'] = $gateway_settings_options['payment.sudopay_website_id'];
    $sudopay_post_variable['buyer_ip'] = $_SERVER['REMOTE_ADDR'];
    $sudopay_post_variable['item_name'] = $course_data['title'];
    $sudopay_post_variable['item_description'] = $course_data['title'];
    if ($gateway_exist) {
        $sudopay_post_variable['marketplace_receiver_id'] = $sudopay_receiver_account_id;
        $sudopay_post_variable['marketplace_receiver_amount'] = $amount - $site_fee;
        $sudopay_post_variable['marketplace_fixed_merchant_amount'] = $site_fee;
        $sudopay_post_variable['marketplace_fees_payer'] = 'buyer';
    } else {
	    $sudopay_post_variable['fees_payer'] = 'buyer';	
	}
    $sudopay_post_variable['buyer_fees_payer_confirmation_token'] = $buyer_fees_payer_confirmation_token;
    $s = new SudoPay_API(array(
        'api_key' => !empty($gateway_settings_options['payment.sudopay_api_key']) ? $gateway_settings_options['payment.sudopay_api_key'] : '',
        'merchant_id' => !empty($gateway_settings_options['payment.sudopay_merchant_id']) ? $gateway_settings_options['payment.sudopay_merchant_id'] : '',
        'website_id' => !empty($gateway_settings_options['payment.sudopay_website_id']) ? $gateway_settings_options['payment.sudopay_website_id'] : '',
        'secret_string' => !empty($gateway_settings_options['payment.sudopay_secret_string']) ? $gateway_settings_options['payment.sudopay_secret_string'] : '',
        'is_test' => !empty($gateway_settings_options['payment.is_live_mode']) ? 0 : 1 //Reverse is_live_mode = 1 mean is_test should be assign to 0
        
    ));
    $SudoPayResponse = array();
    if ($gateway_exist && !empty($enabledPlugins[0]['value']) && strpos($enabledPlugins[0]['value'], 'Payout') !== false) {
		$SudoPayResponse = $s->callMarketplaceCapture($sudopay_post_variable);
    } else {
		$SudoPayResponse = $s->callCapture($sudopay_post_variable);
    }
    $response = $SudoPayResponse;
    if (!empty($SudoPayResponse['error']['code']) && $SudoPayResponse['error']['code'] > 0) {
        $response = array(
            'error' => array(
                'code' => 1
            )
        );
        $response['error']['message'] = $SudoPayResponse['error']['message'];
    }
    return $response;
}
function makeSudoPayRequestForSubscriptionPayment($subscription_id, $user_id, $currencycode, $r_post)
{
    $gateway_id = $r_post['gateway_id'];
    if (!empty($r_post['buyer_email'])) {
        $sudopay_post_variable['buyer_email'] = $r_post['buyer_email'];
    }
    if (!empty($r_post['buyer_address'])) {
        $sudopay_post_variable['buyer_address'] = $r_post['buyer_address'];
    }
    if (!empty($r_post['buyer_city'])) {
        $sudopay_post_variable['buyer_city'] = $r_post['buyer_city'];
    }
    if (!empty($r_post['buyer_state'])) {
        $sudopay_post_variable['buyer_state'] = $r_post['buyer_state'];
    }
    if (!empty($r_post['buyer_country'])) {
        $sudopay_post_variable['buyer_country'] = $r_post['buyer_country'];
    }
    if (!empty($r_post['buyer_zip_code'])) {
        $sudopay_post_variable['buyer_zip_code'] = $r_post['buyer_zip_code'];
    }
    if (!empty($r_post['buyer_phone'])) {
        $sudopay_post_variable['buyer_phone'] = $r_post['buyer_phone'];
    }
    // Setting CC information to post SudoPay
    if (!empty($r_post['credit_card_number'])) {
        $sudopay_post_variable['credit_card_number'] = $r_post['credit_card_number'];
    }
    if (!empty($r_post['credit_card_expire'])) {
        $sudopay_post_variable['credit_card_expire'] = $r_post['credit_card_expire'];
    }
    if (!empty($r_post['credit_card_name_on_card'])) {
        $sudopay_post_variable['credit_card_name_on_card'] = $r_post['credit_card_name_on_card'];
    }
    if (!empty($r_post['credit_card_code'])) {
        $sudopay_post_variable['credit_card_code'] = $r_post['credit_card_code'];
    }
    $conditions = array(
        $subscription_id
    );
    $subscription_data = r_query("SELECT * FROM subscriptions WHERE id = $1", $conditions);
    $user_subscription_logs_post['subscription_start_date'] = date('Y-m-d H:i:s');
    $user_subscription_logs_post['subscription_end_date'] = date('Y-m-d H:i:s', strtotime('+' . $subscription_data['interval_period'] . ' ' . $subscription_data['interval_unit']));
    $sudopay_post_variable['amount'] = $subscription_data['price'];
    $sudopay_post_variable['currency_code'] = $currencycode;
    $user_subscriptions_post['user_id'] = $user_id;
    $user_subscriptions_post['subscription_id'] = $subscription_id;
    $user_subscriptions_post['subscription_status_id'] = ConstSubscriptionStatuses::Initiated;
    $user_subscriptions_post['sudopay_gateway_id'] = $gateway_id;
    $user_subscriptions_post['payment_gateway_id'] = ConstPaymentGateways::SudoPay;
    $user_subscriptions_post['buyer_email'] = !empty($sudopay_post_variable['buyer_email']) ? $sudopay_post_variable['buyer_email'] : '';
    $user_subscriptions_post['buyer_address'] = !empty($sudopay_post_variable['buyer_address']) ? $sudopay_post_variable['buyer_address'] : '';
    $user_subscriptions_post['buyer_city'] = !empty($sudopay_post_variable['buyer_city']) ? $sudopay_post_variable['buyer_city'] : '';
    $user_subscriptions_post['buyer_state'] = !empty($sudopay_post_variable['buyer_state']) ? $sudopay_post_variable['buyer_state'] : '';
    $user_subscriptions_post['buyer_country'] = !empty($sudopay_post_variable['buyer_country']) ? $sudopay_post_variable['buyer_country'] : '';
    $user_subscriptions_post['buyer_zip_code'] = !empty($sudopay_post_variable['buyer_zip_code']) ? $sudopay_post_variable['buyer_zip_code'] : '';
    $user_subscriptions_post['buyer_phone'] = !empty($sudopay_post_variable['buyer_phone']) ? $sudopay_post_variable['buyer_phone'] : '';
    $user_subscriptions_result = pg_execute_insert('user_subscriptions', $user_subscriptions_post);
    $user_subscription_logs_post['user_id'] = $user_id;
    $user_subscription_logs_post['user_subscription_id'] = $user_subscriptions_result['id'];
    $user_subscription_logs_post['subscription_id'] = $subscription_id;
    $user_subscription_logs_post['subscription_status_id'] = ConstSubscriptionStatuses::Initiated;
    $user_subscription_logs_post['amount'] = $subscription_data['price'];
    $user_subscription_logs_result = pg_execute_insert('user_subscription_logs', $user_subscription_logs_post);
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
    $hash = md5(ACE_SECRET_KEY . $user_subscription_logs_result['id'] . SITE_NAME);
    $sudopay_post_variable['notify_url'] = getSiteUri() . '/ipn/process_ipn/user_subscription_logs/' . $user_subscription_logs_result['id'] . '/hash/' . $hash;
    $sudopay_post_variable['success_url'] = getSiteUri() . '/#!/me/subscriptions';
    $sudopay_post_variable['cancel_url'] = getSiteUri() . '/#!/me/subscriptions';
    $sudopay_post_variable['merchant_id'] = $gateway_settings_options['payment.sudopay_merchant_id'];
    $sudopay_post_variable['website_id'] = $gateway_settings_options['payment.sudopay_website_id'];
    $sudopay_post_variable['buyer_ip'] = $_SERVER['REMOTE_ADDR'];
    $sudopay_post_variable['item_name'] = 'Subscription for ' . $subscription_data['name'];
    $sudopay_post_variable['item_description'] = 'Subscription for ' . $subscription_data['name'];
    $s = new SudoPay_API(array(
        'api_key' => !empty($gateway_settings_options['payment.sudopay_api_key']) ? $gateway_settings_options['payment.sudopay_api_key'] : '',
        'merchant_id' => !empty($gateway_settings_options['payment.sudopay_merchant_id']) ? $gateway_settings_options['payment.sudopay_merchant_id'] : '',
        'website_id' => !empty($gateway_settings_options['payment.sudopay_website_id']) ? $gateway_settings_options['payment.sudopay_website_id'] : '',
        'secret_string' => !empty($gateway_settings_options['payment.sudopay_secret_string']) ? $gateway_settings_options['payment.sudopay_secret_string'] : '',
        'is_test' => !empty($gateway_settings_options['payment.is_live_mode']) ? 0 : 1 //Reverse is_live_mode = 1 mean is_test should be assign to 0
        
    ));
    if ($gateway_id == 1) {
        $sudopay_post_variable['x-user_subscription_id'] = $user_subscriptions_result['id'];
        $sudopay_post_variable['user_handle'] = $user_subscriptions_result['id'];
        $sudopay_post_variable['x-sudopay_payment_gateway_id'] = 1;
        if ($subscription_data['trial_period_days'] != 0) {
            $sudopay_post_variable['a1'] = $subscription_data['trial_period_price'];
            $sudopay_post_variable['p1'] = $subscription_data['trial_period_days'];
            $sudopay_post_variable['t1'] = 'D';
        }
        $sudopay_post_variable['a3'] = $subscription_data['price'];
        $sudopay_post_variable['p3'] = $subscription_data['interval_period'];
        $sudopay_post_variable['t3'] = strtoupper(substr($subscription_data['interval_unit'], 0, 1));
        $SudoPayResponse = $s->callCreatePayPalSubscription($sudopay_post_variable);
        $response = $SudoPayResponse;
    } else {
        $sudopay_post_variable['gateway_id'] = $gateway_id;
        $sudopay_post_variable['amount'] = $subscription_data['price'];
        $sudopay_post_variable['x-sudopay_payment_gateway_id'] = $gateway_id;
        $sudopay_post_variable['x-user_subscription_id'] = $user_subscriptions_result['id'];
        $vault_post_variable['user_handle'] = $user_subscriptions_result['id'];
        $vault_post_variable['website_id'] = $gateway_settings_options['payment.sudopay_website_id'];
        $vault_post_variable['merchant_id'] = $gateway_settings_options['payment.sudopay_merchant_id'];
        // Setting CC information to post SudoPay
        if (!empty($r_post['credit_card_number'])) {
            $app_path = dirname(dirname(dirname(dirname(__FILE__)))) . DIRECTORY_SEPARATOR;
            $vault_post_variable['credit_card_number'] = $r_post['credit_card_number'];
            $vault_post_variable['credit_card_type'] = cardType($r_post['credit_card_number']);
        }
        if (!empty($r_post['credit_card_expire'])) {
            $vault_post_variable['credit_card_expire'] = $r_post['credit_card_expire'];
        }
        if (!empty($r_post['credit_card_name_on_card'])) {
            $vault_post_variable['credit_card_name_on_card'] = $r_post['credit_card_name_on_card'];
        }
        if (!empty($r_post['credit_card_code'])) {
            $vault_post_variable['credit_card_code'] = $r_post['credit_card_code'];
        }
        if (!empty($r_post['buyer_email'])) {
            $vault_post_variable['email'] = $r_post['buyer_email'];
        }
        if (!empty($r_post['buyer_address'])) {
            $vault_post_variable['address'] = $r_post['buyer_address'];
        }
        if (!empty($r_post['buyer_city'])) {
            $vault_post_variable['city'] = $r_post['buyer_city'];
        }
        if (!empty($r_post['buyer_state'])) {
            $vault_post_variable['state'] = $r_post['buyer_state'];
        }
        if (!empty($r_post['buyer_country'])) {
            $vault_post_variable['country'] = $r_post['buyer_country'];
        }
        if (!empty($r_post['buyer_zip_code'])) {
            $vault_post_variable['zip_code'] = $r_post['buyer_zip_code'];
        }
        if (!empty($r_post['buyer_phone'])) {
            $vault_post_variable['phone'] = $r_post['buyer_phone'];
        }
        $SudoPayResponse = $s->callAddVault($vault_post_variable);
		if($SudoPayResponse['error']['code'] == 0) {
			if (!empty($SudoPayResponse['vault_key']) && !empty($SudoPayResponse['user_handle'])) {
				$user_subscriptions_put['id'] = $user_subscriptions_result['id'];
				$user_subscriptions_put['vault_key'] = $SudoPayResponse['vault_key'];
				$result = pg_execute_update('user_subscriptions', $user_subscriptions_put);
				$SudoPayResponse = $s->callCapture($sudopay_post_variable);
				if ($SudoPayResponse['status'] == "Captured") {

					// To updating previous active records (other than this) to inactive (User have only one should be active at a time)
					require_once APP_PATH . DIRECTORY_SEPARATOR . 'server' . DIRECTORY_SEPARATOR . 'php' . DIRECTORY_SEPARATOR . 'plugins' . DIRECTORY_SEPARATOR . 'Subscriptions' . DIRECTORY_SEPARATOR . 'functions.php';
					updateSubscriptionPlansToCancel($user_id);

					$user_subscription_put['id'] = $user_subscriptions_result['id'];
					$user_subscription_put['subscription_status_id'] = ConstSubscriptionStatuses::Active;
					$result = pg_execute_update('user_subscriptions', $user_subscription_put);
					$user_subscription_logs_put['id'] = $user_subscription_logs_result['id'];
					$user_subscription_logs_put['sudopay_payment_id'] = $SudoPayResponse['id'];
					$user_subscription_logs_put['subscription_status_id'] = ConstSubscriptionStatuses::Active;
					if (!empty($SudoPayResponse['paykey'])) {
						$user_subscription_logs_put['paykey'] = $SudoPayResponse['paykey'];
					}
					$result = pg_execute_update('user_subscription_logs', $user_subscription_logs_put);
					// For updating total_spend in user table
					if(!empty($user_id)) {
						_updateRevenue(null, $user_id);
					}
					$response = array(
						'error' => array(
							'code' => 0
						)
					);
					$response['error']['message'] = 'Success';
				} else {
					$user_subscription_put['id'] = $user_subscriptions_result['id'];
					$user_subscription_put['subscription_status_id'] = ConstSubscriptionStatuses::PendingPayment;
					$result = pg_execute_update('user_subscriptions', $user_subscription_put);
					$response = array(
						'error' => array(
							'code' => 1
						)
					);
					$response['error']['message'] = $SudoPayResponse['error']['message'];
				}
			}
		}
    }
    if (!empty($SudoPayResponse['error']['code']) && $SudoPayResponse['error']['code'] > 0) { // Error case from sudopay site... like invalid ISO code.. etc
        $response = array(
            'error' => array(
                'code' => 1
            )
        );
        $response['error']['message'] = $SudoPayResponse['error']['message'];
    }
    return $response;
}