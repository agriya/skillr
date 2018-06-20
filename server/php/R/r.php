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
$_server_protocol = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] != 'off') ? 'https' : 'http';
$_server_domain_url = isset($_SERVER['HTTP_HOST']) ? $_server_protocol . '://' . $_SERVER['HTTP_HOST'] : ""; // http://localhost
if (PHP_SAPI == 'cli') { // if command line mode...
    $app_path = dirname(dirname(__FILE__)) . DIRECTORY_SEPARATOR;
    require_once $app_path . 'bootstrap.php';
} else {
    require_once '../bootstrap.php';
}
/**
 * Common method to handle all GET request
 *
 * @param string $r_resource_cmd     URL
 * @param array  $r_resource_vars    Array generated from URL
 * @param array  $r_resource_filters Array generated from URL query string
 * @param array  $r_get              Get data
 * @return mixed
 */
function r_get($r_resource_cmd, $r_resource_vars, $r_resource_filters)
{
    global $r_debug, $authUser, $token;
    $query_timeout = 0;
    $sql = false;
    $elastic_search_sql = false;
    $parent_genre_name = '';
    $sort = 'id';
    $sort_by = 'DESC';
    $field = '*';
    $limit = PAGING_COUNT;
    if (!empty($r_resource_filters['sort'])) {
        $sort = $r_resource_filters['sort'];
    }
    if (!empty($r_resource_filters['sort_by'])) {
        $sort_by = $r_resource_filters['sort_by'];
    }
    if (!empty($r_resource_filters['field'])) {
        $field = $r_resource_filters['field'];
    }
    if (!empty($r_resource_filters['limit'])) {
        $limit = $r_resource_filters['limit'];
    }
    $val_arr = $conditions = $response = $filter_counts = array();
    $pluginConditions = array(
        'site.enabled_plugins'
    );
    // For site only pay through connected gateways; Instructor plugin enabled and Withdrawal plugin disabled case
    // Getting instructor's connected gateway here
    if ($r_resource_cmd === '/get_gateways' || $r_resource_cmd === '/courses/?' || $r_resource_cmd === '/courses' || $r_resource_cmd === '/online_course_lessons/?' || $r_resource_cmd === '/settings') {
        $enabledPlugins = pg_query_cache("SELECT value FROM settings WHERE name = $1 order by display_order", $pluginConditions);
    }
    switch ($r_resource_cmd) {
    case '/get_gateways': // To get list of gatways from sudopay
        $message = '';
        //Checking PayPal Plugin is enabled
        $sudopay_gateway_respone = $paypal_gateway_respone = array();
        if (!empty($enabledPlugins[0]['value']) && strpos($enabledPlugins[0]['value'], 'PayPal') !== false) {
            $paypal_gateway_respone = array(
                'error' => array(
                    'code' => 0
                ) ,
                'paypal_enabled' => true
            );
        } else {
            $paypal_gateway_respone['error']['code'] = 1;
        }
        //checking SudoPay is enabled
        if (!empty($enabledPlugins[0]['value']) && strpos($enabledPlugins[0]['value'], 'SudoPay') !== false) {
            // Including SudoPay vendor file
            require_once APP_PATH . DIRECTORY_SEPARATOR . 'server' . DIRECTORY_SEPARATOR . 'php' . DIRECTORY_SEPARATOR . 'plugins' . DIRECTORY_SEPARATOR . 'SudoPay' . DIRECTORY_SEPARATOR . 'sudopay.php';
            //getting sudopay settings
            $conditions = array(
                ConstSettingCategories::SudoPay
            );
            $settings = pg_query_cache("SELECT * FROM settings WHERE setting_category_id = $1  order by display_order", $conditions);
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
            $gateway_groups = array();
            $enabled_gateways = array();
            // for subscription payment we need to display only credit and debit card supported gateways and paypal subscription gateway
            $supported_query = '';
            if (!empty($r_resource_filters['gateway_type']) && $r_resource_filters['gateway_type'] == 'subscription') {
                $supported_query['preferred_gateways'] = '6054,2,3140,6030,2504,6040,6037,3010,2964,6025,6038,6022,6043,6046,6044,6047,6053,1'; // Only passed CC payment and PayPal (id: 1) for paypal subscription option; https://zazpay.com/gateways; There is no option to filter in SudoPay without hard coding;
                
            }
            $gateway_response = $s->callGateways($supported_query);
            $i = 0;
            if (!empty($gateway_response['gateways'])) {
                foreach ($gateway_response['gateways'] as $group_gateway) {
                    if (!empty($group_gateway['gateways'])) {
                        unset($group_gateway['gateways']);
                        $groups[] = $group_gateway;
                    }
                }
                foreach ($gateway_response['gateways'] as $group_gateway) {
                    if (!empty($group_gateway['gateways'])) {
                        foreach ($group_gateway['gateways'] as $gateway) {
                            $gateway['group_id'] = $group_gateway['id'];
                            $gateways[] = $gateway;
                        }
                    }
                }
                $form_fields_tpls = $gateway_response['_form_fields_tpls'];
                foreach ($form_fields_tpls as $key => $value) {
                    foreach ($form_fields_tpls[$key]['_fields'] as $field_name => $required) {
                        // For label
                        $search = array(
                            'buyer_',
                            'credit_card_'
                        );
                        if ($field_name == 'credit_card_number' || $field_name == 'credit_card_code') {
                            $replace = array(
                                '',
                                'card_'
                            );
                        } else {
                            $replace = array(
                                '',
                                ''
                            );
                        }
                        $label = str_replace($search, $replace, $field_name);
                        $form_fields_tpls[$key]['_fields'][$field_name]['label'] = $label;
                    }
                }
                $form_fields_tpls['credit_card']['_html5'] = '<h3 class="well space textb text-16 ver-mspace">Credit Card Details <span><img alt="[Image: Credit Cards]" src="img/credit-detail.png"></span></h3><div class = "cc-section span no-mar"><input credit-card name="credit_card_number" id="credit_card_number" type="text"  class="cc-number SudopayCreditCardNumber" placeholder="Card Number" required/><div class="cc-type"></div><div class="cc-default"></div></div><input name="credit_card_expire" id="credit_card_expire" type="text"  class="cc-exp" placeholder="Expires (MM/YYYY)" required/><input name="credit_card_name_on_card" id="credit_card_name_on_card" type="text"  class="card_name" placeholder="Name on Card" required/><input name="credit_card_code" id="credit_card_code" type="text"  class="cc-cvc" placeholder="Card Code" required/>';
                $gateway_settings_options['is_payment_via_api'] = 1;
                if ($gateway_settings_options['is_payment_via_api'] != 2) {
                    if (!empty($groups)) {
                        foreach ($groups As $group) {
                            $gatewayGroups[$group['id']] = $group;
                        }
                        $gateway_groups = $gatewayGroups + $gateway_groups;
                    }
                    // To make first tab default
                    $j = 1;
                    foreach ($gateway_groups as $key => $gateway_group) {
                        if ($j == 1) {
                            $gateway_groups[$key]['active'] = true;
                        }
                        break;
                    }
                    $gateway_array = $allowedGatewayGroups = array();
                    $payment_gateway_arrays = array();
                    if (!empty($gateways)) {
                        foreach ($gateways as $gateway) {
                            $payment_gateway_arrays[$i]['id'] = $gateway['id'];
                            $payment_gateway_arrays[$i]['payment_id'] = 'sp_' . $gateway['id'];
                            $payment_gateway_arrays[$i]['sp_' . $gateway['id']] = implode($gateway['_form_fields']['_extends_tpl'], ",");
                            $payment_gateway_arrays[$i]['form_fields'] = implode($gateway['_form_fields']['_extends_tpl'], ",");
                            $payment_gateway_arrays[$i]['display_name'] = $gateway['display_name'];
                            $payment_gateway_arrays[$i]['thumb_url'] = $gateway['thumb_url'];
                            $payment_gateway_arrays[$i]['group_id'] = $gateway['group_id'];
                            $templates['sp_' . $gateway['id']] = implode($gateway['_form_fields']['_extends_tpl'], ",");
                            $gateway_array['sp_' . $gateway['id']] = '<div class="pull-left"><img src="' . $gateway['thumb_url'] . '" alt="' . $gateway['display_name'] . '" /><span class="show">' . $gateway['display_name'] . '</span></div>'; //for image
                            $gateway_instructions['sp_' . $gateway['id']] = (!empty($gateway['instruction_for_manual'])) ? urldecode($gateway['instruction_for_manual']) : '';
                            $gateway_form['sp_' . $gateway['id']] = (!empty($gateway['_form_fields']['_fields'])) ? array_keys((array)$gateway['_form_fields']['_fields']) : '';
                            $i++;
                            if (!empty($displayOnlyConnectedGateway)) {
                                $allowedGatewayGroups[] = $gateway['group_id'];
                            }
                        }
                        $gateway_types = $gateway_array;
                        $payment_gateways = $payment_gateway_arrays;
                    }
                }
                if (!empty($gateway_groups)) {
                    $default_gateway_id = '';
                    foreach ($payment_gateways As $key => $value) {
                        $default_gateway_id = $value['payment_id'];
                        break;
                    }
                    $selected_payment_gateway_id = $default_gateway_id;
                }
                if (!empty($displayOnlyConnectedGateway) && empty($templates)) {
                    $sudopay_gateway_respone['error']['code'] = 1;
                    $sudopay_gateway_respone['error']['message'] = "This lecturer not yet ready to collect payment.";
                } else if (empty($templates)) {
                    $sudopay_gateway_respone['error']['code'] = 1;
                    $sudopay_gateway_respone['error']['message'] = "Site not yet configure the payment options.";
                } else {
                    $template1 = '';
                    $sql = '';
                    $sudopay_gateway_respone = array(
                        'error' => array(
                            'code' => 0
                        ) ,
                        'payment_gateways' => $payment_gateways,
                        'gateway_groups' => $gateway_groups,
                        'templates' => $templates,
                        'form_fields_tpls' => $form_fields_tpls,
                        'selected_payment_gateway_id' => $selected_payment_gateway_id,
                        'gateway_instructions' => $gateway_instructions,
                        'template1' => $template1,
                        'gateway_settings_options' => $gateway_settings_options
                    );
                }
            } else {
                $sudopay_gateway_respone['error']['code'] = 1;
                $sudopay_gateway_respone['error']['message'] = "Unable to connect payment gateways";
            }
        } else {
            $sudopay_gateway_respone['error']['code'] = 1;
        }
        $response['sudopay'] = $sudopay_gateway_respone;
        $response['paypal'] = $paypal_gateway_respone;
        break;

    case '/token': // OAuth token
        // To create the token for refresh token
        if (empty($_GET['refresh_token'])) {
            $post_val = array(
                'grant_type' => 'client_credentials',
                'client_id' => OAUTH_CLIENTID,
                'client_secret' => OAUTH_CLIENT_SECRET
            );
            $response = getToken($post_val);
        }
        break;

    case '/refresh_token': // To get user details with Token
        $post_val = array(
            'grant_type' => 'refresh_token',
            'refresh_token' => $r_resource_filters['refresh_token'],
            'client_id' => OAUTH_CLIENTID,
            'client_secret' => OAUTH_CLIENT_SECRET
        );
        $_response = getToken($post_val);
        if (!empty($_response['access_token'])) {
            $_conditions = array(
                $r_resource_filters['refresh_token']
            );
            $oauth_token = r_query("SELECT user_id FROM oauth_refresh_tokens WHERE refresh_token = $1 ", $_conditions);
            $_conditions = array(
                $oauth_token['user_id'],
            );
            $users = r_query("SELECT id FROM users WHERE email = $1", $_conditions);
            if (!empty($users)) {
                $response = $_response;
            } else {
                $response['error']['code'] = 1;
            }
        } else {
            $response['error']['code'] = 1;
        }
        break;

    case '/settings': // site settings details
        if (!empty($r_resource_filters['setting_category_id']) && $authUser['providertype'] == 'admin') {
            $sort = 'display_order';
            $sort_by = 'ASC';
            $conditions['setting_category_id'] = 'AND';
            $val_arr[] = $r_resource_filters['setting_category_id'];
            if (!empty($enabledPlugins[0]['value']) && strpos($enabledPlugins[0]['value'], 'Translations') === false) {
                $conditions['name'] = 'NotIn';
                $val_arr[] = 'site.site_languages';
            }
            if (!empty($enabledPlugins[0]['value']) && strpos($enabledPlugins[0]['value'], 'CourseCheckout') === false) {
                $conditions['name'] = 'NotIn';
                $val_arr[] = 'course.max_course_fee';
            }
            $where = getWhereCondition($conditions);
            $c_sql = "SELECT count(*) FROM settings" . $where;
            $sql = "SELECT row_to_json(d) FROM (SELECT $field FROM settings" . $where . " ORDER BY " . $sort . " " . $sort_by . ") as d ";
        } else {
            $c_sql = "SELECT count(*) FROM settings where setting_category_id not in (" . ConstSettingCategories::Revenue . ", " . ConstSettingCategories::SudoPay . ")";
            $sql = "SELECT row_to_json(d) FROM (SELECT $field FROM settings where setting_category_id NOT IN (" . ConstSettingCategories::Revenue . ", " . ConstSettingCategories::SudoPay . ", " . ConstSettingCategories::MOOCAffiliate . ", " . ConstSettingCategories::PayPal . ") order by display_order) as d ";
        }
        break;

    case '/admin/overview': // To get admin overview details
        if (!empty($authUser) && $authUser['providertype'] == 'admin') {
            $response['data'] = array();
            $response['error']['code'] = 0;
            $active_course_data = r_query("select count(id) as cnt from courses WHERE course_status_id = " . ConstCourseStatuses::Active);
            $response['data']['total_active_courses'] = $active_course_data['cnt'];
            $course_user_data = r_query("select CASE WHEN (sum(site_commission_amount) > 0) THEN sum(site_commission_amount) ELSE '0' END as revenue, count(id) as total_order from course_users WHERE course_user_status_id != " . ConstCourseUserStatuses::PaymentPending);
            $response['data']['revenue'] = $course_user_data['revenue'];
            $response['data']['total_order'] = $course_user_data['total_order'];
            $user_data = r_query("SELECT count(id) as cnt from users WHERE is_active = 't' AND isemailverified = 1");
            $response['data']['users'] = $user_data['cnt'];
        } else {
            $response['error'] = 1;
            $response['message'] = 'Authentication failed';
        }
        break;

    case '/admin/activities': // To get admin activities details
        if (!empty($authUser) && $authUser['providertype'] == 'admin') {
            $response['data'] = array();
            $response['error']['code'] = 0;
            $course_data = r_query("select to_char(created, 'YYYY-MM-DD HH24:MI:SS') as created from courses WHERE course_status_id != " . ConstCourseStatuses::Draft . " order by id desc limit 1 offset 0");
            $response['data']['last_course_posted'] = $course_data['created'];
            $course_user_data = r_query("select to_char(created, 'YYYY-MM-DD HH24:MI:SS') as booked_date  from course_users WHERE course_user_status_id != " . ConstCourseUserStatuses::PaymentPending . " order by id desc limit 1 offset 0");
            $response['data']['last_booking'] = $course_user_data['booked_date'];
            $course_user_feedback_data = r_query("select to_char(created, 'YYYY-MM-DD HH24:MI:SS') as created  from course_user_feedbacks order by id desc limit 1 offset 0");
            $response['data']['new_feedback'] = $course_user_feedback_data['created'];
            $users_data = r_query("select to_char(created, 'YYYY-MM-DD HH24:MI:SS') as created from users WHERE is_active = 't' AND isemailverified = 1 order by id desc limit 1 offset 0");
            $response['data']['last_register'] = $users_data['created'];
            $user_login_data = r_query("select to_char(created, 'YYYY-MM-DD HH24:MI:SS') as created  from user_logins order by id desc limit 1 offset 0");
            $response['data']['last_user_login'] = $user_login_data['created'];
            $course_favourites_data = r_query("select to_char(created, 'YYYY-MM-DD HH24:MI:SS') as created  from course_favourites order by id desc limit 1 offset 0");
            $response['data']['last_wishlist'] = $course_favourites_data['created'];
        } else {
            $response['error'] = 1;
            $response['message'] = 'Authentication failed';
        }
        break;

    case '/admin/stats': // To get admin stats details
        if (!empty($authUser) && $authUser['providertype'] == 'admin') {
            $response['data'] = array();
            $response['error']['code'] = 0;
            $interval = '7 days';
            if (!empty($r_resource_filters['filter'])) {
                if ($r_resource_filters['filter'] == 'lastDays') {
                    $interval = '7 days';
                } else if ($r_resource_filters['filter'] == 'lastWeeks') {
                    $interval = '4 weeks';
                } else if ($r_resource_filters['filter'] == 'lastMonths') {
                    $interval = '3 months';
                } else if ($r_resource_filters['filter'] == 'lastYears') {
                    $interval = '3 years';
                }
            }
            $data = r_query("select count(id) as cnt from users WHERE  created > (CURRENT_DATE - INTERVAL '" . $interval . "')");
            $response['data']['user_register'] = $data['cnt'];
            $data = r_query("select count(id) as cnt from user_logins WHERE  created > (CURRENT_DATE - INTERVAL '" . $interval . "')");
            $response['data']['user_login'] = $data['cnt'];
            $data = r_query("select count(id) as cnt from courses WHERE  created > (CURRENT_DATE - INTERVAL '" . $interval . "')");
            $response['data']['course_posted'] = $data['cnt'];
            $data = r_query("select count(id) as cnt from course_users WHERE course_user_status_id != " . ConstCourseUserStatuses::PaymentPending . " AND created > (CURRENT_DATE - INTERVAL '" . $interval . "')");
            $response['data']['course_bookings'] = $data['cnt'];
            $data = r_query("select count(id) as cnt from course_favourites WHERE  created > (CURRENT_DATE - INTERVAL '" . $interval . "')");
            $response['data']['course_favorites'] = $data['cnt'];
            $data = r_query("select count(id) as cnt from course_user_feedbacks WHERE  created > (CURRENT_DATE - INTERVAL '" . $interval . "')");
            $response['data']['course_feedbacks'] = $data['cnt'];
            $data = r_query("select count(id) as cnt from transactions WHERE  created > (CURRENT_DATE - INTERVAL '" . $interval . "')");
            $response['data']['transactions'] = $data['cnt'];
        } else {
            $response['error'] = 1;
            $response['message'] = 'Authentication failed';
        }
        break;

    case '/auth': // For twitter social login
        $response = social_auth_login($r_resource_filters['type']);
        break;

    case '/users': // To get complete users listing with Filters
        if ((!empty($authUser) && ($authUser['providertype'] == 'userpass' || ($authUser['providertype'] == 'admin' && (empty($r_resource_filters['filter']) && empty($r_resource_filters['isemailverified']))))) || empty($authUser)) {
            // For front end users - should display only active user list
            // Case 1: logged in && front end user
            // Case 2: logged in && admin user and not set filter
            // Case 3: Guest Users
            $conditions['is_active'] = 't';
            $val_arr[] = 't';
        } else if (!empty($r_resource_filters['filter']) && $r_resource_filters['filter'] != 'all') {
            // for admin end code // have various filter options and option to display all active/inactive users
            if ($r_resource_filters['filter'] == 'active') {
                $conditions['is_active'] = 't';
                $val_arr[] = 't';
            } else if ($r_resource_filters['filter'] == 'inactive') {
                $conditions['is_active'] = 'f';
                $val_arr[] = 'f';
            }
        }
        if (!empty($r_resource_filters['isemailverified'])) {
            if ($r_resource_filters['isemailverified'] == 'yes') {
                $conditions['isemailverified'] = '1';
                $val_arr[] = 1;
            } else if ($r_resource_filters['isemailverified'] == 'no') {
                $conditions['isemailverified'] = '0';
                $val_arr[] = 0;
            }
        }
        if (!empty($r_resource_filters['is_teacher'])) {
            $conditions['is_teacher'] = $r_resource_filters['is_teacher'];
            $val_arr[] = $r_resource_filters['is_teacher'];
        }
        if (!empty($r_resource_filters['providertype']) && $r_resource_filters['providertype'] == 'instructor') {
            $conditions['is_teacher'] = 1;
            $val_arr[] = 1;
        } else if (!empty($r_resource_filters['providertype']) && $r_resource_filters['providertype'] != 'all') {
            $conditions['providertype'] = $r_resource_filters['providertype'];
            $val_arr[] = $r_resource_filters['providertype'];
        }
        if (!empty($r_resource_filters['q'])) {
            $conditions['OR']['displayname'] = strtolower($r_resource_filters['q']);
            $conditions['OR']['email'] = strtolower($r_resource_filters['q']);
            $val_arr[] = '%' . strtolower($r_resource_filters['q']) . '%';
            $val_arr[] = '%' . strtolower($r_resource_filters['q']) . '%';
        }
        $sort = 'user_id';
        $where = getWhereCondition($conditions);
        if (!empty($authUser) && $authUser['providertype'] == 'admin') {
            $field = '*';
            $field.= ", to_char(created, 'YYYY-MM-DD HH24:MI:SS') as created";
        } else {
            $field = "id,displayname,designation,user_id,image_hash,biography";
        }
        $c_sql = "SELECT count(*) FROM users_listing" . $where;
        $sql = "SELECT row_to_json(d) FROM (SELECT $field FROM users_listing" . $where . " ORDER BY " . $sort . " " . $sort_by . ") as d ";
        break;

    case '/users/?': // To get particular users detail based on Id
        $val_arr[] = $r_resource_vars['users'];
        $c_sql = "SELECT count(*) FROM users_listing WHERE user_id = $1";
        $field.= ", to_char(created, 'YYYY-MM-DD HH24:MI:SS') as created";
        $sql = "SELECT row_to_json(d) FROM (SELECT $field FROM users_listing WHERE user_id = $1) as d ";
        break;

    case '/cities': // To get cities listing with Filters
        if ((!empty($authUser) && ($authUser['providertype'] == 'userpass' || ($authUser['providertype'] == 'admin' && empty($r_resource_filters['filter'])))) || empty($authUser)) {
            // For front end users - should display only active user list
            // Case 1: logged in && front end user
            // Case 2: logged in && admin user and not set filter
            // Case 3: Guest Users
            $conditions['is_active'] = 'AND';
            $val_arr[] = 't';
        } else if (!empty($r_resource_filters['filter']) && $r_resource_filters['filter'] != 'all') {
            if ($r_resource_filters['filter'] == 'active') {
                $conditions['is_active'] = 'AND';
                $val_arr[] = 't';
            } else if ($r_resource_filters['filter'] == 'inactive') {
                $conditions['is_active'] = 'AND';
                $val_arr[] = 'f';
            }
        }
        if (!empty($r_resource_filters['q'])) {
            $conditions['OR']['name'] = strtolower($r_resource_filters['q']);
            $val_arr[] = '%' . strtolower($r_resource_filters['q']) . '%';
        }
        $where = getWhereCondition($conditions);
        $c_sql = "SELECT count(*) FROM cities_listing" . $where;
        $sql = "SELECT row_to_json(d) FROM (SELECT $field FROM cities_listing" . $where . " ORDER BY " . $sort . " " . $sort_by . ") as d ";
        break;

    case '/cities/?': // To get particular cities detail based on Id
        $val_arr[] = $r_resource_vars['cities'];
        $c_sql = "SELECT count(*) FROM cities_listing WHERE id = $1";
        $sql = "SELECT row_to_json(d) FROM (SELECT $field FROM cities_listing WHERE id = $1) as d ";
        break;

    case '/categories': // To get categories listing with Filters
        if ((!empty($authUser) && ($authUser['providertype'] == 'userpass' || ($authUser['providertype'] == 'admin' && empty($r_resource_filters['filter'])))) || empty($authUser)) {
            // For front end users - should display only active user list
            // Case 1: logged in && front end user
            // Case 2: logged in && admin user and not set filter
            // Case 3: Guest Users
            $conditions['is_active'] = 'AND';
            $val_arr[] = 't';
        } else if (!empty($r_resource_filters['filter']) && $r_resource_filters['filter'] != 'all') {
            if ($r_resource_filters['filter'] == 'active') {
                $conditions['is_active'] = 'AND';
                $val_arr[] = 't';
            } else if ($r_resource_filters['filter'] == 'inactive') {
                $conditions['is_active'] = 'AND';
                $val_arr[] = 'f';
            }
        }
        if (!empty($r_resource_filters['category_type'])) { // is_null - for getting only parent category
            if ($r_resource_filters['category_type'] == 'parent') {
                $conditions['parent_category_name'] = null;
            }
            if ($r_resource_filters['category_type'] == 'child') {
                $conditions['parent_category_name'] = 'NotEqual';
                $val_arr[] = '';
            }
        }
        if (!empty($r_resource_filters['parent_id'])) {
            $conditions['parent_id'] = 'AND';
            $val_arr[] = $r_resource_filters['parent_id'];
        }
        if (!empty($r_resource_filters['q'])) {
            $conditions['OR']['parent_category_name'] = strtolower($r_resource_filters['q']);
            $conditions['OR']['sub_category_name'] = strtolower($r_resource_filters['q']);
            $val_arr[] = '%' . strtolower($r_resource_filters['q']) . '%';
            $val_arr[] = '%' . strtolower($r_resource_filters['q']) . '%';
        }
        $where = getWhereCondition($conditions);
        $field = "id,is_active,sub_category_name,parent_category_name,description";
        if (!empty($r_resource_filters['category_type']) && $r_resource_filters['category_type'] == 'parent') {
            $field.= ',sub_category';
        }
        if (!empty($r_resource_filters['field'])) {
            $fields = explode(",", $field);
            $check_values = explode(",", $r_resource_filters['field']);
            $temp = "";
            foreach ($check_values as $check_value) {
                if (in_array(trim($check_value) , $fields)) {
                    $temp.= trim($check_value) . ", ";
                }
            }
            $field = substr($temp, 0, -2);
        }
        $c_sql = "SELECT count(*) FROM categories_listing" . $where;
        $sql = "SELECT row_to_json(d) FROM (SELECT $field FROM categories_listing" . $where . " ORDER BY " . $sort . " " . $sort_by . ") as d ";
        break;

    case '/categories/?': // To get particular categories detail based on Id
        $val_arr[] = $r_resource_vars['categories'];
        $field = "id,parent_id,parent_category_name,sub_category_name,is_online,is_active,description";
        $category = r_query("SELECT id FROM categories WHERE id = $1 and parent_id is null", $val_arr);
        if (!empty($category)) {
            $field.= ',sub_category';
        }
        if (!empty($r_resource_filters['field'])) {
            $fields = explode(",", $field);
            $check_values = explode(",", $r_resource_filters['field']);
            $temp = "";
            foreach ($check_values as $check_value) {
                if (in_array(trim($check_value) , $fields)) {
                    $temp.= trim($check_value) . ", ";
                }
            }
            $field = substr($temp, 0, -2);
        }
        $c_sql = "SELECT count(*) FROM categories_listing WHERE id = $1";
        $sql = "SELECT row_to_json(d) FROM (SELECT $field FROM categories_listing WHERE id = $1) as d ";
        break;

    case '/course_roadmap': // To get course roadmap listing
        //todo
        break;

    case '/course_statuses': // To get course statuses listing with Filter
        if (!empty($r_resource_filters['q'])) {
            $conditions['OR']['name'] = strtolower($r_resource_filters['q']);
            $val_arr[] = '%' . strtolower($r_resource_filters['q']) . '%';
        }
        $where = getWhereCondition($conditions);
        $c_sql = "SELECT count(*) FROM course_statuses" . $where;
        $sql = "SELECT row_to_json(d) FROM (SELECT $field FROM course_statuses" . $where . " ORDER BY " . $sort . " " . $sort_by . ") as d ";
        break;

    case '/countries': // To get countries listing with Filters
        if (!empty($r_resource_filters['filter'])) {
            if ($r_resource_filters['filter'] == 'active') {
                $conditions['is_active'] = 'AND';
                $val_arr[] = 't';
            } else if ($r_resource_filters['filter'] == 'inactive') {
                $conditions['is_active'] = 'AND';
                $val_arr[] = 'f';
            }
        }
        if (!empty($r_resource_filters['q'])) {
            $conditions['OR']['name'] = strtolower($r_resource_filters['q']);
            $val_arr[] = '%' . strtolower($r_resource_filters['q']) . '%';
        }
        $where = getWhereCondition($conditions);
        $c_sql = "SELECT count(*) FROM countries_listing " . $where;
        $sql = "SELECT row_to_json(d) FROM (SELECT $field FROM countries_listing " . $where . " ORDER BY " . $sort . " " . $sort_by . ") as d ";
        break;

    case '/countries/?': // To get particular countries detail based on Id
        $val_arr[] = $r_resource_vars['countries'];
        $c_sql = "SELECT count(*) FROM countries_listing WHERE id = $1";
        $sql = "SELECT row_to_json(d) FROM (SELECT $field FROM countries_listing WHERE id = $1) as d ";
        break;

    case '/states': // To get states listing with Filters
        if ((!empty($authUser) && ($authUser['providertype'] == 'userpass' || ($authUser['providertype'] == 'admin' && empty($r_resource_filters['filter'])))) || empty($authUser)) {
            // For front end users - should display only active user list
            // Case 1: logged in && front end user
            // Case 2: logged in && admin user and not set filter
            // Case 3: Guest Users
            $conditions['is_active'] = 'AND';
            $val_arr[] = 't';
        } else if (!empty($r_resource_filters['filter']) && $r_resource_filters['filter'] != 'all') {
            if ($r_resource_filters['filter'] == 'active') {
                $conditions['is_active'] = 'AND';
                $val_arr[] = 't';
            } else if ($r_resource_filters['filter'] == 'inactive') {
                $conditions['is_active'] = 'AND';
                $val_arr[] = 'f';
            }
        }
        if (!empty($r_resource_filters['q'])) {
            $conditions['OR']['name'] = strtolower($r_resource_filters['q']);
            $val_arr[] = '%' . strtolower($r_resource_filters['q']) . '%';
        }
        $where = getWhereCondition($conditions);
        $c_sql = "SELECT count(*) FROM states_listing " . $where;
        $sql = "SELECT row_to_json(d) FROM (SELECT $field FROM states_listing " . $where . " ORDER BY " . $sort . " " . $sort_by . ") as d ";
        break;

    case '/states/?': // To get particular states detail based on Id
        $val_arr[] = $r_resource_vars['states'];
        $c_sql = "SELECT count(*) FROM states_listing WHERE id = $1";
        $sql = "SELECT row_to_json(d) FROM (SELECT $field FROM states_listing WHERE id = $1) as d ";
        break;

    case '/ips': // To get ips listing with Filters
        if (!empty($r_resource_filters['q'])) {
            $conditions['OR']['ip'] = strtolower($r_resource_filters['q']);
            $conditions['OR']['user_agent'] = strtolower($r_resource_filters['q']);
            $conditions['OR']['city_name'] = strtolower($r_resource_filters['q']);
            $conditions['OR']['state_name'] = strtolower($r_resource_filters['q']);
            $conditions['OR']['country_name'] = strtolower($r_resource_filters['q']);
            $val_arr[] = '%' . strtolower($r_resource_filters['q']) . '%';
            $val_arr[] = '%' . strtolower($r_resource_filters['q']) . '%';
            $val_arr[] = '%' . strtolower($r_resource_filters['q']) . '%';
            $val_arr[] = '%' . strtolower($r_resource_filters['q']) . '%';
            $val_arr[] = '%' . strtolower($r_resource_filters['q']) . '%';
        }
        $where = getWhereCondition($conditions);
        $c_sql = "SELECT count(*) FROM ips_listing" . $where;
        $sql = "SELECT row_to_json(d) FROM (SELECT $field FROM ips_listing" . $where . " ORDER BY " . $sort . " " . $sort_by . ") as d ";
        break;

    case '/ips/?': // To get particular ips detail based on Id
        $val_arr[] = $r_resource_vars['ips'];
        $c_sql = "SELECT count(*) FROM ips_listing WHERE id = $1";
        $sql = "SELECT row_to_json(d) FROM (SELECT $field FROM ips_listing WHERE id = $1) as d ";
        break;

    case '/pages': // To get pages listing with filter
        if (!empty($r_resource_filters['q'])) {
            $conditions['OR']['title'] = strtolower($r_resource_filters['q']);
            $val_arr[] = '%' . strtolower($r_resource_filters['q']) . '%';
        }
        $where = getWhereCondition($conditions);
        $c_sql = "SELECT count(*) FROM pages" . $where;
        $sql = "SELECT row_to_json(d) FROM (SELECT $field FROM pages" . $where . " ORDER BY " . $sort . " " . $sort_by . ") as d ";
        break;

    case '/pages/?': // To get particular pages detail based on Id
        $val_arr[] = $r_resource_vars['pages'];
        $c_sql = "SELECT count(*) FROM pages WHERE id = $1";
        $sql = "SELECT row_to_json(d) FROM (SELECT $field FROM pages WHERE id = $1) as d ";
        break;

    case '/page/?': // To get particular pages detail based on Slug for front end
        $conditions['slug'] = 'AND';
        $val_arr[] = $r_resource_vars['page'];
        if (!empty($r_resource_filters['iso2'])) {
            $conditions['iso2'] = 'AND';
            $val_arr[] = $r_resource_filters['iso2'];
        }
        $where = getWhereCondition($conditions);
        $c_sql = "SELECT count(*) FROM pages_listing " . $where;
        $sql = "SELECT row_to_json(d) FROM (SELECT $field FROM pages_listing " . $where . ") as d ";
        break;

    case '/email_templates': // To get email templates listing with Filters
        if ($authUser['providertype'] == 'admin') {
            if (!empty($r_resource_filters['q'])) {
                $conditions['OR']['name'] = strtolower($r_resource_filters['q']);
                $val_arr[] = '%' . strtolower($r_resource_filters['q']) . '%';
            }
            $where = getWhereCondition($conditions);
            $c_sql = "SELECT count(*) FROM email_templates" . $where;
            $sql = "SELECT row_to_json(d) FROM (SELECT $field FROM email_templates" . $where . " ORDER BY " . $sort . " " . $sort_by . ") as d ";
        } else {
            $response['error'] = 1;
            $response['message'] = 'Authentication failed';
        }
        break;

    case '/email_templates/?': // To get particular email templates detail based on Id
        $val_arr[] = $r_resource_vars['email_templates'];
        $c_sql = "SELECT count(*) FROM email_templates WHERE id = $1";
        $sql = "SELECT row_to_json(d) FROM (SELECT $field FROM email_templates WHERE id = $1) as d ";
        break;

    case '/user_logins': // To get user logins listing with Filters
        if (!empty($r_resource_filters['filter'])) {
            if ($r_resource_filters['filter'] == 'active') {
                $conditions['is_active'] = 't';
                $val_arr[] = 't';
            } else if ($r_resource_filters['filter'] == 'inactive') {
                $conditions['is_active'] = 'f';
                $val_arr[] = 'f';
            }
        }
        if (!empty($r_resource_filters['user_id'])) {
            $conditions['user_id'] = $r_resource_filters['user_id'];
            $val_arr[] = $r_resource_filters['user_id'];
        }
        if (!empty($r_resource_filters['q'])) {
            $conditions['OR']['displayname'] = strtolower($r_resource_filters['q']);
            $val_arr[] = '%' . strtolower($r_resource_filters['q']) . '%';
        }
        $where = getWhereCondition($conditions);
        $c_sql = "SELECT count(*) FROM user_logins_listing" . $where;
        $field.= ", to_char(created, 'YYYY-MM-DD HH24:MI:SS') as created";
        $sql = "SELECT row_to_json(d) FROM (SELECT $field FROM user_logins_listing" . $where . " ORDER BY " . $sort . " " . $sort_by . ") as d ";
        break;

    case '/user_logins/?': // To get particular user logins detail based on Id
        $val_arr[] = $r_resource_vars['user_logins'];
        $c_sql = "SELECT count(*) FROM user_logins_listing WHERE id = $1";
        $sql = "SELECT row_to_json(d) FROM (SELECT $field FROM user_logins_listing WHERE id = $1) as d ";
        break;

    case '/course_users': // To get course users listing with Filters
        if (!empty($r_resource_filters['filter'])) {
            if ($r_resource_filters['filter'] == 'paid') {
                $conditions['course_user_status_slug'] = 'NotEqual';
                $val_arr[] = 'payment_pending';
            } else {
                $conditions['course_user_status_slug'] = $r_resource_filters['filter'];
                $val_arr[] = $r_resource_filters['filter'];
            }
        }
        if (!empty($r_resource_filters['course_id'])) {
            $conditions['course_id'] = $r_resource_filters['course_id'];
            $val_arr[] = $r_resource_filters['course_id'];
        }
        if (!empty($r_resource_filters['user_id'])) {
            $conditions['user_id'] = $r_resource_filters['user_id'];
            $val_arr[] = $r_resource_filters['user_id'];
        }
        if (!empty($r_resource_filters['q'])) {
            $conditions['OR']['course_title'] = strtolower($r_resource_filters['q']);
            $val_arr[] = '%' . strtolower($r_resource_filters['q']) . '%';
        }
        $where = getWhereCondition($conditions);
        $field = "id,created,course_title,course_slug,teacher_name,learner_name,course_user_status,price,site_commission_amount,to_char(booked_date, 'DD-MM-YYYY') as booked_date";
        if (!empty($r_resource_filters['field'])) {
            $fields = explode(",", $field);
            $check_values = explode(",", $r_resource_filters['field']);
            $temp = "";
            foreach ($check_values as $check_value) {
                if (in_array(trim($check_value) , $fields)) {
                    $temp.= trim($check_value) . ", ";
                }
            }
            $field = substr($temp, 0, -2);
        }
        if ($authUser['providertype'] == 'admin') {
            $c_sql = "SELECT count(*) FROM course_users_listing" . $where;
            $sql = "SELECT row_to_json(d) FROM (SELECT $field FROM course_users_listing" . $where . " ORDER BY " . $sort . " " . $sort_by . ") as d ";
        } else {
            $response['error'] = 1;
            $response['message'] = 'Authentication failed';
        }
        break;

    case '/courses/?/course_users': // To get course users list based on course id with Filters
        if (!empty($r_resource_filters['q'])) {
            $conditions['OR']['name'] = strtolower($r_resource_filters['q']);
            $val_arr[] = '%' . strtolower($r_resource_filters['q']) . '%';
        }
        $field = "id,learner_name,user_image";
        if (!empty($r_resource_filters['field'])) {
            $fields = explode(",", $field);
            $check_values = explode(",", $r_resource_filters['field']);
            $temp = "";
            foreach ($check_values as $check_value) {
                if (in_array(trim($check_value) , $fields)) {
                    $temp.= trim($check_value) . ", ";
                }
            }
            $field = substr($temp, 0, -2);
        }
        $val_arr[] = $r_resource_vars['courses'];
        $course_owner = r_query("SELECT user_id FROM courses WHERE id = $1", $val_arr);
        $course_user = r_query("SELECT user_id FROM course_users WHERE course_id = $1 ", $val_arr);
        if ($authUser['id'] == $course_owner['user_id'] || $authUser['id'] == $course_user['user_id'] || $authUser['providertype'] == 'admin') {
            $c_sql = "SELECT count(*) FROM course_users_listing WHERE course_id = $1";
            $sql = "SELECT row_to_json(d) FROM (SELECT $field FROM course_users_listing" . " WHERE course_id = $1  ORDER BY " . $sort . " " . $sort_by . ") as d ";
        } else {
            $response['error'] = 1;
            $response['message'] = 'Authentication failed';
        }
        break;

    case '/courses/?/users/?/course_users': // To get course users list based on course id and user id with Filters
        $conditions['course_id'] = $r_resource_vars['courses'];
        $val_arr[] = $r_resource_vars['courses'];
        $conditions['user_id'] = $r_resource_vars['users'];
        $val_arr[] = $r_resource_vars['users'];
        if (!empty($r_resource_filters['q'])) {
            $conditions['OR']['course_title'] = strtolower($r_resource_filters['q']);
            $conditions['OR']['teacher_name'] = strtolower($r_resource_filters['q']);
            $conditions['OR']['learner_name'] = strtolower($r_resource_filters['q']);
            $val_arr[] = '%' . strtolower($r_resource_filters['q']) . '%';
            $val_arr[] = '%' . strtolower($r_resource_filters['q']) . '%';
            $val_arr[] = '%' . strtolower($r_resource_filters['q']) . '%';
        }
        $where = getWhereCondition($conditions);
        if ($authUser['id'] == $r_resource_vars['users'] || $authUser['providertype'] == 'admin') {
            $c_sql = "SELECT count(*) FROM course_users_listing " . $where;
            $sql = "SELECT row_to_json(d) FROM (SELECT $field FROM course_users_listing" . $where . "  ORDER BY " . $sort . " " . $sort_by . ") as d ";
        } else {
            $response['error'] = 1;
            $response['message'] = 'Authentication failed';
        }
        break;

    case '/users/?/course_users': // To get course users list based on user id with Filters
        $conditions['user_id'] = 'AND';
        $val_arr[] = $r_resource_vars['users'];
        if (!empty($r_resource_filters['q'])) {
            $conditions['OR']['name'] = strtolower($r_resource_filters['q']);
            $val_arr[] = '%' . strtolower($r_resource_filters['q']) . '%';
        }
        if (!empty($r_resource_filters['filter'])) {
            if ($r_resource_filters['filter'] === 'active') {
                $conditions['course_user_status_id'] = 'NotEqual';
                $val_arr[] = ConstCourseUserStatuses::Archived;
            } else {
                $conditions['course_user_status_slug'] = $r_resource_filters['filter'];
                $val_arr[] = $r_resource_filters['filter'];
            }
        }
        $where = getWhereCondition($conditions);
        $field = "id,course_id,user_id,course_title,course_slug,price,course_price,course_user_status,is_favourite,course_user_feedback_count,learner_name,course_image,course_image_hash,subtitle,instructional_level_id,instructional_level_name,category_id,category_name,parent_category_id,parent_category_name,teacher_name,teacher_user_id,completed_lesson_count,active_online_course_lesson_count,rating,is_from_mooc_affiliate,mooc_affiliate_course_link";
        if (!empty($r_resource_filters['field'])) {
            $fields = explode(",", $field);
            $check_values = explode(",", $r_resource_filters['field']);
            $temp = "";
            foreach ($check_values as $check_value) {
                if (in_array(trim($check_value) , $fields)) {
                    $temp.= trim($check_value) . ", ";
                }
            }
            $field = substr($temp, 0, -2);
        }
        $c_sql = "SELECT count(*) FROM course_users_listing " . $where;
        $sql = "SELECT row_to_json(d) FROM (SELECT $field FROM course_users_listing " . $where . "  ORDER BY " . $sort . " " . $sort_by . ") as d ";
        break;

    case '/course_users/?': // To get particular course users detail based on Id
        $field = "id,course_id,user_id,course_title,course_slug,course_user_status,booked_date,learner_name,teacher_name,price";
        if (!empty($r_resource_filters['field'])) {
            $fields = explode(",", $field);
            $check_values = explode(",", $r_resource_filters['field']);
            $temp = "";
            foreach ($check_values as $check_value) {
                if (in_array(trim($check_value) , $fields)) {
                    $temp.= trim($check_value) . ", ";
                }
            }
            $field = substr($temp, 0, -2);
        }
        $val_arr[] = $r_resource_vars['course_users'];
        $course_user = r_query("SELECT user_id FROM course_users WHERE id = $1 ", $val_arr);
        if ($authUser['id'] == $course_user['user_id']) {
            $c_sql = "SELECT count(*) FROM course_users_listing WHERE id = $1";
            $sql = "SELECT row_to_json(d) FROM (SELECT $field FROM course_users_listing WHERE id = $1) as d ";
        } else {
            $response['error'] = 1;
            $response['message'] = 'Authentication failed';
        }
        break;

    case '/setting_categories': // To get settings listing with Filters
        $setting_plugin = r_query("SELECT value FROM settings WHERE name ='site.enabled_plugins'");
        $notInCategories = array();
        $notInCategories[] = ConstSettingCategories::Plugins;
        if (!empty($setting_plugin) && strpos($setting_plugin['value'], 'SudoPay') === false) {
            $notInCategories[] = ConstSettingCategories::SudoPay;
        }
        if (!empty($setting_plugin) && strpos($setting_plugin['value'], 'Comments') === false) {
            $notInCategories[] = ConstSettingCategories::Comments;
        }
        if (!empty($setting_plugin) && strpos($setting_plugin['value'], 'Withdrawal') === false) {
            $notInCategories[] = ConstSettingCategories::Withdrawal;
        }
        if (!empty($setting_plugin) && strpos($setting_plugin['value'], 'Analytics') === false) {
            $notInCategories[] = ConstSettingCategories::Analytics;
        }
        if (!empty($setting_plugin) && strpos($setting_plugin['value'], 'MOOCAffiliate') === false) {
            $notInCategories[] = ConstSettingCategories::MOOCAffiliate;
        }
        if (!empty($setting_plugin) && strpos($setting_plugin['value'], 'PayPal') === false) {
            $notInCategories[] = ConstSettingCategories::PayPal;
        }
        if (!empty($setting_plugin) && strpos($setting_plugin['value'], 'CourseCheckout') === false) {
            $notInCategories[] = ConstSettingCategories::Revenue;
        }
        if (!empty($setting_plugin) && strpos($setting_plugin['value'], 'Instructor') === false) {
            $notInCategories[] = ConstSettingCategories::Course;
        }
        if (!empty($setting_plugin) && strpos($setting_plugin['value'], 'Banner') === false) {
            $notInCategories[] = ConstSettingCategories::Banner;
        }
        if (!empty($setting_plugin) && strpos($setting_plugin['value'], 'VideoLessons') === false) {
            $notInCategories[] = ConstSettingCategories::VideoLessons;
        }
        $categories = implode(",", $notInCategories);
        $sort = 'display_order';
        $sort_by = 'asc';
        $c_sql = "SELECT count(*) FROM setting_categories_listing WHERE id NOT IN (" . $categories . ")";
        $sql = "SELECT row_to_json(d) FROM (SELECT $field FROM setting_categories_listing WHERE id NOT IN (" . $categories . ") ORDER BY " . $sort . " " . $sort_by . ") as d ";
        break;

    case '/setting_categories/?/settings': // To get particular settings detail based on Setting category id
        $val_arr[] = $r_resource_vars['setting_categories'];
        $c_sql = "SELECT count(*) FROM settings WHERE setting_category_id = $1";
        $sql = "SELECT row_to_json(d) FROM (SELECT $field FROM settings WHERE setting_category_id = $1) as d ";
        break;

    case '/contacts': // To get contacts listing with Filter
        if (!empty($r_resource_filters['q'])) {
            $conditions['OR']['first_name'] = strtolower($r_resource_filters['q']);
            $conditions['OR']['last_name'] = strtolower($r_resource_filters['q']);
            $conditions['OR']['subject'] = strtolower($r_resource_filters['q']);
            $conditions['OR']['message'] = strtolower($r_resource_filters['q']);
            $conditions['OR']['email'] = strtolower($r_resource_filters['q']);
            $val_arr[] = '%' . strtolower($r_resource_filters['q']) . '%';
            $val_arr[] = '%' . strtolower($r_resource_filters['q']) . '%';
            $val_arr[] = '%' . strtolower($r_resource_filters['q']) . '%';
            $val_arr[] = '%' . strtolower($r_resource_filters['q']) . '%';
            $val_arr[] = '%' . strtolower($r_resource_filters['q']) . '%';
        }
        $where = getWhereCondition($conditions);
        $c_sql = "SELECT count(*) FROM contacts_listing" . $where;
        $sql = "SELECT row_to_json(d) FROM (SELECT $field FROM contacts_listing" . $where . " ORDER BY " . $sort . " " . $sort_by . ") as d ";
        break;

    case '/contacts/?': // To get particular contacts detail based on Id
        $val_arr[] = $r_resource_vars['contacts'];
        $c_sql = "SELECT count(*) FROM contacts_listing WHERE id = $1";
        $sql = "SELECT row_to_json(d) FROM (SELECT $field FROM contacts_listing WHERE id = $1) as d ";
        break;

    case '/courses': // To get course listing with Filters
        if ((!empty($authUser) && ($authUser['providertype'] == 'userpass' || ($authUser['providertype'] == 'admin' && empty($r_resource_filters['filter']) && empty($r_resource_filters['admin_listing'])))) || empty($authUser)) {
            // For front end users - should display only active user list
            // Case 1: logged in && front end user
            // Case 2: logged in && admin user and not set filter
            // Case 3: Guest Users
            $conditions['course_status_id'] = 'AND';
            $val_arr[] = ConstCourseStatuses::Active;
        } else if (!empty($r_resource_filters['filter']) && $r_resource_filters['filter'] != 'all') {
            // for admin end code have various filter options and option to display all active/inactive course
            if ($r_resource_filters['filter'] == 'Draft') {
                $conditions['course_status_id'] = 'AND';
                $val_arr[] = ConstCourseStatuses::Draft;
            } else if ($r_resource_filters['filter'] == 'Waiting for Approval') {
                $conditions['course_status_id'] = 'AND';
                $val_arr[] = ConstCourseStatuses::WaitingForApproval;
            } else if ($r_resource_filters['filter'] == 'Active') {
                $conditions['course_status_id'] = 'AND';
                $val_arr[] = ConstCourseStatuses::Active;
            }
        }
        // If MOOCAffiliate is disabled, then we should not display course from MOOCAffiliate;
        if (!empty($enabledPlugins[0]['value']) && strpos($enabledPlugins[0]['value'], 'MOOCAffiliate') === false) {
            $conditions['is_from_mooc_affiliate'] = 'NotEqual';
            $val_arr[] = 1;
        }
        if (!empty($r_resource_filters['filter']) && $r_resource_filters['filter'] === 'is_featured') {
            $conditions['is_featured'] = 'AND';
            $val_arr[] = 't';
        }
        if (!empty($r_resource_filters['priceType'])) {
            if ($r_resource_filters['priceType'] == 'Free') {
                $conditions['price'] = 'AND';
            } else if ($r_resource_filters['priceType'] == 'Paid') {
                $conditions['price'] = 'NotEqual';
            }
            $val_arr[] = 0;
        }
        if (!empty($r_resource_filters['user_id'])) {
            $conditions['user_id'] = $r_resource_filters['user_id'];
            $val_arr[] = $r_resource_filters['user_id'];
        }
        if (!empty($r_resource_filters['instructional_level_id'])) {
            $conditions['instructional_level_id'] = $r_resource_filters['instructional_level_id'];
            $val_arr[] = $r_resource_filters['instructional_level_id'];
        }
        if (!empty($r_resource_filters['language_id'])) {
            $conditions['language_id'] = $r_resource_filters['language_id'];
            $val_arr[] = $r_resource_filters['language_id'];
        }
        if (!empty($r_resource_filters['q'])) {
            $conditions['title'] = "LIKE";
            $val_arr[] = '%' . strtolower($r_resource_filters['q']) . '%';
        }
        if (!empty($r_resource_filters['category_id'])) {
            $conditions['OR']['category_id'] = 'OR';
            $val_arr[] = $r_resource_filters['category_id'];
            $check_conditions = array(
                $r_resource_filters['category_id']
            );
            $check_parent = r_query("SELECT id FROM categories_listing WHERE id = $1 and parent_id is null", $check_conditions);
            if ($check_parent) {
                $conditions['OR']['parent_category_id'] = 'OR';
                $val_arr[] = $r_resource_filters['category_id'];
            }
        }
        $where = getWhereCondition($conditions);
        $field = "id,title,slug,user_id,displayname,price,subtitle,course_image,image_hash,total_rating,average_rating,course_user_count,course_user_feedback_count,instructional_level_name,online_course_lesson_count,category_name,category_id,description,parent_category_id,parent_category_name,active_online_course_lesson_count,user_image_hash,promo_video,is_favourite,is_featured,is_promo_video_converting_is_processing,is_promo_video_convert_error,is_from_mooc_affiliate,mooc_affiliate_course_link,instructional_level_id,designation";
        if (!empty($authUser) && $authUser['providertype'] == 'admin') {
            $field.= ",total_revenue_amount,site_revenue_amount,course_status_name,course_favourite_count";
        }
        if (!empty($r_resource_filters['field'])) {
            $fields = explode(",", $field);
            $check_values = explode(",", $r_resource_filters['field']);
            $temp = "";
            foreach ($check_values as $check_value) {
                if (in_array(trim($check_value) , $fields)) {
                    $temp.= trim($check_value) . ", ";
                }
            }
            $field = substr($temp, 0, -2);
        }
        $c_sql = "SELECT count(*) FROM courses_listing" . $where;
        $sql = "SELECT row_to_json(d) FROM (SELECT $field FROM courses_listing" . $where . " ORDER BY " . $sort . " " . $sort_by . ") as d ";
        break;

    case '/courses/?': // To get particular courses detail based on Id
        $val_arr[] = $r_resource_vars['courses'];
        $field = "id,created,category_id,parent_category_id,parent_category_name,title,slug,description,user_id,displayname,category_name,price,course_favourite_count,course_image,image_hash,user_image_hash,is_active,subtitle,students_will_be_able_to,who_should_take_this_course_and_who_should_not,what_actions_students_have_to_perform_before_begin,total_rating,average_rating,online_course_lesson_count,language_name,instructional_level_name,online_course_lesson_count,course_user_count,instructional_level_id,language_id,total_rating,course_status_name,course_status_id,course_user_feedback_count,active_online_course_lesson_count,meta_keywords,meta_description,parent_category_id,parent_category_name,is_favourite,promo_video,is_featured,is_promo_video_converting_is_processing,is_promo_video_convert_error,designation";
        // If MOOCAffiliate is enabled; we need to send mooc_affiliate_course_link and is_from_mooc_affiliate fields
        if (!empty($enabledPlugins[0]['value']) && strpos($enabledPlugins[0]['value'], 'MOOCAffiliate') !== false) {
            $field.= ",mooc_affiliate_course_link,is_from_mooc_affiliate";
        }
        if (!empty($authUser) && $authUser['providertype'] == 'admin') {
            $field.= ",total_revenue_amount,site_revenue_amount";
        }
        if (!empty($r_resource_filters['field'])) {
            $fields = explode(",", $field);
            $check_values = explode(",", $r_resource_filters['field']);
            $temp = "";
            foreach ($check_values as $check_value) {
                if (in_array(trim($check_value) , $fields)) {
                    $temp.= trim($check_value) . ", ";
                }
            }
            $field = substr($temp, 0, -2);
        }
        $c_sql = "SELECT count(*) FROM courses_listing WHERE id = $1";
        $sql = "SELECT row_to_json(d) FROM (SELECT course_status_id,user_id,$field FROM courses_listing WHERE id = $1) as d ";
        if (!empty($r_resource_filters['manage']) && $authUser['providertype'] != 'admin') {
            $c_sql = "SELECT count(*) FROM courses_listing WHERE id = $1 and user_id =" . $authUser['id'];
            $sql = "SELECT row_to_json(d) FROM (SELECT course_status_id,user_id,$field FROM courses_listing WHERE id = $1 and user_id =" . $authUser['id'] . " ) as d ";
        }
        break;

    case '/instructional_levels': // To get instructional levels listing with Filter
        if (!empty($r_resource_filters['q'])) {
            $conditions['OR']['name'] = strtolower($r_resource_filters['q']);
            $val_arr[] = '%' . strtolower($r_resource_filters['q']) . '%';
        }
        $where = getWhereCondition($conditions);
        $c_sql = "SELECT count(*) FROM instructional_levels_listing" . $where;
        $sql = "SELECT row_to_json(d) FROM (SELECT $field FROM instructional_levels_listing" . $where . " ORDER BY " . $sort . " " . $sort_by . ") as d ";
        break;

    case '/instructional_levels/?': // To get particular instructional levels detail based on Id
        $val_arr[] = $r_resource_vars['instructional_levels'];
        $c_sql = "SELECT count(*) FROM instructional_levels_listing WHERE id = $1";
        $sql = "SELECT row_to_json(d) FROM (SELECT $field FROM instructional_levels_listing WHERE id = $1) as d ";
        break;

    case '/languages': // To get languages listing with Filters
        if ((!empty($authUser) && ($authUser['providertype'] == 'userpass' || ($authUser['providertype'] == 'admin' && empty($r_resource_filters['filter'])))) || empty($authUser)) {
            // For front end users - should display only active user list
            // Case 1: logged in && front end user
            // Case 2: logged in && admin user and not set filter
            // Case 3: Guest Users
            $conditions['is_active'] = 'AND';
            $val_arr[] = '1';
            $sort = 'name';
            $sort_by = 'ASC';
        } else if (!empty($r_resource_filters['filter']) && $r_resource_filters['filter'] != 'all') {
            if ($r_resource_filters['filter'] == 'active') {
                $conditions['is_active'] = 'AND';
                $val_arr[] = '1';
            } else if ($r_resource_filters['filter'] == 'inactive') {
                $conditions['is_active'] = 'AND';
                $val_arr[] = '0';
            }
        }
        if (!empty($r_resource_filters['q'])) {
            $conditions['OR']['name'] = strtolower($r_resource_filters['q']);
            $val_arr[] = '%' . strtolower($r_resource_filters['q']) . '%';
        }
        $where = getWhereCondition($conditions);
        $c_sql = "SELECT count(*) FROM languages_listing" . $where;
        $sql = "SELECT row_to_json(d) FROM (SELECT $field FROM languages_listing" . $where . " ORDER BY " . $sort . " " . $sort_by . ") as d ";
        break;

    case '/languages/?': // To get particular language detail based on Id
        $val_arr[] = $r_resource_vars['languages'];
        $c_sql = "SELECT count(*) FROM languages_listing WHERE id = $1";
        $sql = "SELECT row_to_json(d) FROM (SELECT $field FROM languages_listing WHERE id = $1) as d ";
        break;

    case '/categories/?/courses': // To get category wise courses detail based on Category Id
        $conditions['category_id'] = 'AND';
        $val_arr[] = $r_resource_vars['categories'];
        if (!empty($r_resource_filters['filter'])) {
            if ($r_resource_filters['filter'] == 'active') {
                $conditions['course_status_id'] = 'AND';
                $val_arr[] = ConstCourseStatuses::Active;
            } else if ($r_resource_filters['filter'] == 'inactive') {
                $conditions['course_status_id'] = 'NotEqual';
                $val_arr[] = ConstCourseStatuses::Active;
            }
        }
        if (!empty($r_resource_filters['q'])) {
            $conditions['OR']['name'] = strtolower(course_status_id);
            $val_arr[] = '%' . strtolower($r_resource_filters['q']) . '%';
        }
        $where = getWhereCondition($conditions);
        $field = "id,category_id,title,slug,user_id,displayname,total_rating,average_rating,course_user_feedback_count,price,image_hash,course_image,course_user_count,category_name,course_favourite_count";
        if (!empty($r_resource_filters['field'])) {
            $fields = explode(",", $field);
            $check_values = explode(",", $r_resource_filters['field']);
            $temp = "";
            foreach ($check_values as $check_value) {
                if (in_array(trim($check_value) , $fields)) {
                    $temp.= trim($check_value) . ", ";
                }
            }
            $field = substr($temp, 0, -2);
        }
        $c_sql = "SELECT count(*) FROM courses_listing " . $where;
        $sql = "SELECT row_to_json(d) FROM (SELECT $field FROM courses_listing " . $where . " ORDER BY " . $sort . " " . $sort_by . ") as d ";
        break;

    case '/categories/?/courses/?/related': // To get category wise courses detail based on Category Id and course_id not in the list
        $conditions['category_id'] = 'AND';
        $val_arr[] = $r_resource_vars['categories'];
        // Condition for skipping current course
        $conditions['id'] = 'NotIn';
        $val_arr[] = $r_resource_vars['courses'];
        // Condition for only getting active course
        $conditions['course_status_id'] = 'AND';
        $val_arr[] = ConstCourseStatuses::Active;
        $where = getWhereCondition($conditions);
        $field = "id,category_id,title,slug,user_id,displayname,total_rating,average_rating,course_user_feedback_count,price,image_hash,course_image,course_user_count,category_name,course_favourite_count,is_from_mooc_affiliate,mooc_affiliate_course_link";
        if (!empty($r_resource_filters['field'])) {
            $fields = explode(",", $field);
            $check_values = explode(",", $r_resource_filters['field']);
            $temp = "";
            foreach ($check_values as $check_value) {
                if (in_array(trim($check_value) , $fields)) {
                    $temp.= trim($check_value) . ", ";
                }
            }
            $field = substr($temp, 0, -2);
        }
        $c_sql = "SELECT count(*) FROM courses_listing " . $where;
        $sql = "SELECT row_to_json(d) FROM (SELECT $field FROM courses_listing " . $where . " ORDER BY " . $sort . " " . $sort_by . ") as d ";
        break;

    case '/users/?/courses': // To get user wise courses detail based on User Id
        $conditions['user_id'] = 'AND';
        $val_arr[] = $r_resource_vars['users'];
        // Filter empty mean. shoudl be display only active course... This is for public users can only show active course
        if (empty($r_resource_filters['filter'])) {
            $conditions['course_status_id'] = 'AND';
            $val_arr[] = ConstCourseStatuses::Active;
        } else if (!empty($r_resource_filters['filter']) && ($authUser['providertype'] == ' admin' || $r_resource_vars['users'] == $authUser['id'])) {
            // Allowing owner or admin to show all courses
            if ($r_resource_filters['filter'] == 'active') {
                $conditions['course_status_id'] = 'AND';
                $val_arr[] = ConstCourseStatuses::Active;
            } else if ($r_resource_filters['filter'] == 'inactive') {
                $conditions['course_status_id'] = 'NotEqual';
                $val_arr[] = ConstCourseStatuses::Active;
            }
        } else {
            $conditions['course_status_id'] = 'AND';
            $val_arr[] = ConstCourseStatuses::Active;
        }
        if (!empty($r_resource_filters['q'])) {
            $conditions['OR']['name'] = $r_resource_filters['q'];
            $val_arr[] = '%' . strtolower($r_resource_filters['q']) . '%';
        }
        $where = getWhereCondition($conditions);
        $field = "id,user_id,displayname,total_revenue_amount,course_user_count,course_image,title,slug,subtitle,price,is_active,is_public,is_favourite,image_hash,course_status_name,active_online_course_lesson_count,online_course_lesson_count,headline,user_image_hash,subtitle,instructional_level_id,instructional_level_name,category_id,category_name,description,parent_category_id,parent_category_name,is_from_mooc_affiliate,mooc_affiliate_course_link";
        if (!empty($r_resource_filters['field'])) {
            $fields = explode(",", $field);
            $check_values = explode(",", $r_resource_filters['field']);
            $temp = "";
            foreach ($check_values as $check_value) {
                if (in_array(trim($check_value) , $fields)) {
                    $temp.= trim($check_value) . ", ";
                }
            }
            $field = substr($temp, 0, -2);
        }
        $c_sql = "SELECT count(*) FROM courses_listing " . $where;
        $sql = "SELECT row_to_json(d) FROM (SELECT $field FROM courses_listing " . $where . " ORDER BY " . $sort . " " . $sort_by . ") as d ";
        break;

    case '/users/?/courses/?/related': // To get user wise courses detail based on User Id and course_id not in the list
        $conditions['user_id'] = 'AND';
        $val_arr[] = $r_resource_vars['users'];
        $conditions['id'] = 'NotIn';
        $val_arr[] = $r_resource_vars['courses'];
        $conditions['course_status_id'] = 'AND';
        $val_arr[] = ConstCourseStatuses::Active;
        $where = getWhereCondition($conditions);
        $field = "id,user_id,displayname,total_revenue_amount,course_user_count,course_image,title,slug,subtitle,price,is_active,is_public,is_favourite,image_hash,course_status_name,active_online_course_lesson_count,online_course_lesson_count,headline,user_image_hash,subtitle,instructional_level_id,instructional_level_name,category_id,category_name,description,parent_category_id,parent_category_name,is_from_mooc_affiliate,mooc_affiliate_course_link";
        if (!empty($r_resource_filters['field'])) {
            $fields = explode(",", $field);
            $check_values = explode(",", $r_resource_filters['field']);
            $temp = "";
            foreach ($check_values as $check_value) {
                if (in_array(trim($check_value) , $fields)) {
                    $temp.= trim($check_value) . ", ";
                }
            }
            $field = substr($temp, 0, -2);
        }
        $c_sql = "SELECT count(*) FROM courses_listing " . $where;
        $sql = "SELECT row_to_json(d) FROM (SELECT $field FROM courses_listing " . $where . " ORDER BY " . $sort . " " . $sort_by . ") as d ";
        break;

    case '/online_course_lessons': // To get online course lessons listing with Filters
        if (!empty($r_resource_filters['filter'])) {
            if ($r_resource_filters['filter'] == 'active') {
                $conditions['is_active'] = 't';
                $val_arr[] = 't';
            } else if ($r_resource_filters['filter'] == 'inactive') {
                $conditions['is_active'] = 'f';
                $val_arr[] = 'f';
            }
        }
        if (!empty($r_resource_filters['course_id'])) {
            $conditions['course_id'] = $r_resource_filters['course_id'];
            $val_arr[] = $r_resource_filters['course_id'];
        }
        if (!empty($r_resource_filters['q'])) {
            $conditions['OR']['name'] = strtolower($r_resource_filters['q']);
            $val_arr[] = '%' . strtolower($r_resource_filters['q']) . '%';
        }
        $where = getWhereCondition($conditions);
        $c_sql = "SELECT count(*) FROM online_course_lessons_listing" . $where;
        $sql = "SELECT row_to_json(d) FROM (SELECT $field FROM online_course_lessons_listing" . $where . " ORDER BY " . $sort . " " . $sort_by . ") as d ";
        break;

    case '/online_course_lessons/?': // To get particular online course lessons detail based on Id
        $val_arr[] = $r_resource_vars['online_course_lessons'];
        $c_sql = "SELECT count(*) FROM online_course_lessons_listing WHERE id = $1";
        $sql = "SELECT row_to_json(d) FROM (SELECT ocl.$field, CASE WHEN (oclv.is_completed > 0) THEN  '1' ELSE '0' END as completed FROM online_course_lessons_listing ocl left join online_course_lesson_views oclv on ocl.id = oclv.online_course_lesson_id WHERE ocl.id = $1) as d ";
        break;

    case '/online_course_lessons/?/neighbours': // To get particular online course lessons detail based on Id
        $sql = false;
        $_conditions = array(
            $r_resource_vars['online_course_lessons'],
        );
        $online_course_lessons = r_query("SELECT course_id, course_title, course_slug, course_price, display_order FROM online_course_lessons_listing WHERE id = $1 LIMIT 1", $_conditions);
        if (!empty($online_course_lessons)) {
            $_conditions = array(
                $online_course_lessons['display_order'],
                $online_course_lessons['course_id']
            );
            $previous = r_query("SELECT id FROM online_course_lessons WHERE display_order < $1 AND course_id = $2 AND is_active = true AND is_chapter = 0 ORDER BY display_order DESC LIMIT 1", $_conditions);
            if (!empty($previous)) {
                $row['previous_id'] = $previous['id'];
            } else {
                $row['previous_id'] = null;
            }
            $next = r_query("SELECT id FROM online_course_lessons WHERE display_order > $1 AND course_id = $2 AND is_active = true AND is_chapter = 0 ORDER BY display_order ASC LIMIT 1", $_conditions);
            if (!empty($next)) {
                $row['next_id'] = $next['id'];
            } else {
                $row['next_id'] = null;
            }
            $row['course_id'] = $online_course_lessons['course_id'];
            $row['course_title'] = $online_course_lessons['course_title'];
            $row['course_slug'] = $online_course_lessons['course_slug'];
            $row['course_price'] = $online_course_lessons['course_price'];
            echo json_encode($row);
            exit;
        } else {
            $response['error']['code'] = 1;
            $response['error']['message'] = "Not Found";
        }
        break;

    case '/courses/?/online_course_lessons': // To get online course lessons list based on course id
        if (!empty($authUser['id'])) {
            $check_conditions = array(
                $r_resource_vars['courses'],
                $authUser['id']
            );
            $course_owner = r_query("SELECT id FROM courses WHERE id = $1 and user_id = $2", $check_conditions);
            $course_user = r_query("SELECT id FROM course_users WHERE course_id = $1 and user_id = $2", $check_conditions);
        }
        if (!empty($authUser['id']) && ($authUser['providertype'] == 'admin' || !empty($course_owner) || !empty($course_user))) {
            $isAllowToAccess = true;
        }
        if (!empty($r_resource_filters['filter']) && $r_resource_filters['filter'] == 'all' && !empty($authUser['id']) && ($authUser['providertype'] == 'admin' || !empty($course_owner) || !empty($course_user))) {
            // No filter; display active and inactive lessons if call form manage lesson page; with filter=all
            
        } else {
            $conditions['is_active'] = 'AND';
            $val_arr[] = 't';
            $conditions['is_lesson_ready_to_view'] = 'AND';
            $val_arr[] = '1';
        }
        if (!empty($r_resource_filters['q'])) {
            $conditions['OR']['course_title'] = strtolower($r_resource_filters['q']);
            $val_arr[] = '%' . strtolower($r_resource_filters['q']) . '%';
        }
        $check_conditions = array(
            $r_resource_vars['courses'],
            ConstCourseStatuses::Active
        );
        $course_is_publised = r_query("SELECT id FROM courses WHERE id = $1 and course_status_id = $2", $check_conditions);
        if (!empty($isAllowToAccess) || !empty($course_is_publised)) {
            if (empty($authUser)) {
                $conditions['course_id'] = 'AND';
                $val_arr[] = $r_resource_vars['courses'];
                $where = getWhereCondition($conditions);
                $c_sql = "SELECT count(*) FROM online_course_lessons_listing" . $where;
                $sql = "SELECT row_to_json(d) FROM (SELECT $field FROM online_course_lessons_listing" . $where . " ORDER BY " . $sort . " " . $sort_by . ") as d ";
            } else {
                if (!empty($r_resource_filters['view']) && $r_resource_filters['view'] == 'learner_view') {
                    $conditions['oc.course_id'] = 'AND';
                    $val_arr[] = $r_resource_vars['courses'];
                    $where = getWhereCondition($conditions);
                    $sort = 'oc.' . $sort;
                    $c_sql = "SELECT count(*) FROM online_course_lessons_listing oc left join online_course_lesson_views ocl on oc.id = ocl.online_course_lesson_id " . $where;
                    $sql = "SELECT row_to_json(d) FROM (SELECT oc.$field , CASE WHEN (ocl.is_completed > 0) THEN  '1' ELSE '0' END as completed FROM online_course_lessons_listing oc left join online_course_lesson_views ocl on oc.id = ocl.online_course_lesson_id AND ocl.user_id = " . $authUser['id'] . " " . $where . " ORDER BY " . $sort . " " . $sort_by . ") as d ";
                } else {
                    $conditions['course_id'] = 'AND';
                    $val_arr[] = $r_resource_vars['courses'];
                    $where = getWhereCondition($conditions);
                    $c_sql = "SELECT count(*) FROM online_course_lessons_listing" . $where;
                    $sql = "SELECT row_to_json(d) FROM (SELECT $field FROM online_course_lessons_listing" . $where . " ORDER BY " . $sort . " " . $sort_by . ") as d ";
                }
            }
        } else {
            $conditions['course_id'] = 'AND';
            $val_arr[] = $r_resource_vars['courses'];
            $where = getWhereCondition($conditions);
            if (!empty($authUser['id']) && ($authUser['providertype'] == 'admin' || !empty($course_owner) || !empty($course_user))) {
                $c_sql = "SELECT count(*) FROM online_course_lessons_listing" . $where;
                $sql = "SELECT row_to_json(d) FROM (SELECT $field FROM online_course_lessons_listing" . $where . " ORDER BY " . $sort . " " . $sort_by . ") as d ";
            } else {
                $response['error'] = 1;
                $response['message'] = "Authentication failed";
            }
        }
        break;

    case '/instructional_levels_subscriptions': // To get course favourites listing with Filters
        if (!empty($r_resource_filters['subscription_id'])) {
            $conditions['subscription_id'] = 'AND';
            $val_arr[] = $r_resource_filters['subscription_id'];
        }
        if (!empty($r_resource_filters['instructional_level_id'])) {
            $conditions['instructional_level_id'] = 'AND';
            $val_arr[] = $r_resource_filters['instructional_level_id'];
        }
        $field = "id,subscription_id,instructional_level_id";
        $where = getWhereCondition($conditions);
        $c_sql = "SELECT count(*) FROM instructional_levels_subscriptions" . $where;
        $sql = "SELECT row_to_json(d) FROM (SELECT $field FROM instructional_levels_subscriptions" . $where . " ORDER BY " . $sort . " " . $sort_by . ") as d ";
        break;

    case '/user_notifications': // To get user notification listing with Filter
        if (!empty($r_resource_filters['q'])) {
            $conditions['OR']['name'] = strtolower($r_resource_filters['q']);
            $val_arr[] = '%' . strtolower($r_resource_filters['q']) . '%';
        }
        $where = getWhereCondition($conditions);
        $c_sql = "SELECT count(*) FROM user_notifications_listing" . $where;
        $sql = "SELECT row_to_json(d) FROM (SELECT $field FROM user_notifications_listing" . $where . " ORDER BY " . $sort . " " . $sort_by . ") as d ";
        break;

    case '/users/logout': // To logout user
        // To logout from site
        $conditions = array(
            $_GET['token']
        );
        pg_execute_query("DELETE FROM oauth_access_tokens WHERE access_token = $1", $conditions);
        $response['user'] = $authUser = array();
        $sql = false;
        break;

    case '/settings/?': // To get particular settings detail based on Id
        $val_arr[] = $r_resource_vars['settings'];
        $c_sql = "SELECT count(*) FROM settings WHERE id = $1";
        $sql = "SELECT row_to_json(d) FROM (SELECT $field FROM settings WHERE id = $1) as d ";
        break;

    case '/setting_categories/?': // To get particular settings categories detail based on Id
        $val_arr[] = $r_resource_vars['setting_categories'];
        $c_sql = "SELECT count(*) FROM setting_categories_listing WHERE id = $1";
        $sql = "SELECT row_to_json(d) FROM (SELECT $field FROM setting_categories_listing WHERE id = $1) as d ";
        break;

    case '/plugins': //get plugins
        if (!empty($authUser) && $authUser['providertype'] == 'admin') {
            $path = APP_PATH . DIRECTORY_SEPARATOR . 'server' . DIRECTORY_SEPARATOR . 'php' . DIRECTORY_SEPARATOR . 'plugins';
            $directories = array();
            $directories = glob($path . '/*', GLOB_ONLYDIR);
            $available_plugin = array();
            $available_plugin_details = array();
            $pluginArray = array();
            // Creating Main plugin data
            // Course is not a plugin; But for sub plugin listing we created as is_core = 1
            $pluginArray['Courses'] = array();
            $pluginArray['PaymentGateways'] = array();
            $pluginArray['CourseCheckout'] = array();
            foreach ($directories as $key => $val) {
                $json = file_get_contents($val . DIRECTORY_SEPARATOR . 'plugin.json');
                $data = json_decode($json, true);
                if ($data['name'] != 'CourseCheckout') { // We set this CourseCheckout value below the code
                    if (!empty($data['dependencies'])) {
                        $pluginArray[$data['dependencies']][$data['name']] = $data;
                    } else if (!in_array($data['name'], $pluginArray)) {
                        if (empty($pluginArray[$data['name']])) {
                            $pluginArray[] = $data;
                        }
                    }
                }
            }
            $courseRelatedPlugins = array();
            // Checking having any Courses plugin enabled; If nothing enabled mean, need to remove "Courses" from $pluginArray array
            if (empty($pluginArray['Courses'])) {
                unset($pluginArray['Courses']);
            } else { // For changing JSON format for displaying admin end;
                $coursePlugins = $pluginArray['Courses'];
                unset($pluginArray['Courses']);
                foreach ($coursePlugins as $coursePlugin) {
                    $courseRelatedPlugins['sub_plugins'][] = $coursePlugin;
                }
            }
            // Creating Payment Gateway plugin
            $paymentGatewayPlugins = array();
            // Checking having any Courses plugin enabled; If nothing enabled mean, need to remove "Courses" from $pluginArray array
            if (empty($pluginArray['PaymentGateways'])) {
                unset($pluginArray['PaymentGateways']);
            } else { // For changing JSON format for displaying admin end;
                $gatewayPlugins = $pluginArray['PaymentGateways'];
                unset($pluginArray['PaymentGateways']);
                foreach ($gatewayPlugins as $gatewayPlugin) {
                    $paymentGatewayPlugins['sub_plugins'][] = $gatewayPlugin;
                }
            }
            $paymentAndCartRelatedPlugins = array();
            if (!empty($pluginArray['CourseCheckout'])) {
                if (is_dir($path . DIRECTORY_SEPARATOR . 'CourseCheckout')) {
                    $json = file_get_contents($path . DIRECTORY_SEPARATOR . 'CourseCheckout' . DIRECTORY_SEPARATOR . 'plugin.json');
                    $data = json_decode($json, true);
                    $paymentAndCartRelatedPlugins = $data;
                }
                foreach ($pluginArray['CourseCheckout'] as $paypmentAndCart) {
                    $paymentAndCartRelatedPlugins['sub_plugins'][] = $paypmentAndCart;
                }
                unset($pluginArray['CourseCheckout']);
            } else { // If no sub plugin is bought and CourseCheckout is available case - following code will be execute
                unset($pluginArray['CourseCheckout']);
                if (is_dir($path . DIRECTORY_SEPARATOR . 'CourseCheckout')) {
                    $json = file_get_contents($path . DIRECTORY_SEPARATOR . 'CourseCheckout' . DIRECTORY_SEPARATOR . 'plugin.json');
                    $data = json_decode($json, true);
                    $paymentAndCartRelatedPlugins = $data;
                }
            }
            $otherlugins = array();
            foreach ($pluginArray as $plugin) {
                $otherlugins[] = $plugin;
            }
            $setting_plugin = r_query("SELECT value FROM settings WHERE name ='site.enabled_plugins'");
            $enabled_plugin = explode(",", $setting_plugin['value']);
            $enabled_plugin = array_map('trim', $enabled_plugin);
            $response['course_plugin'] = $courseRelatedPlugins;
            $response['payment_and_cart_plugin'] = $paymentAndCartRelatedPlugins;
            $response['payment_gateway_plugin'] = $paymentGatewayPlugins;
            $response['other_plugin'] = $otherlugins;
            $response['enabled_plugin'] = $enabled_plugin;
        } else {
            $response['error'] = 1;
            $response['message'] = 'Authentication failed';
        }
        break;

    case '/ipn_logs': // To get sudopay ipn logs listing with Filters
        if (!empty($r_resource_filters['q'])) {
            $conditions['OR']['post_variable'] = strtolower($r_resource_filters['q']);
            $val_arr[] = '%' . strtolower($r_resource_filters['q']) . '%';
        }
        $where = getWhereCondition($conditions);
        $field = "id,ip_id,post_variable";
        if (!empty($r_resource_filters['field'])) {
            $fields = explode(",", $field);
            $check_values = explode(",", $r_resource_filters['field']);
            $temp = "";
            foreach ($check_values as $check_value) {
                if (in_array(trim($check_value) , $fields)) {
                    $temp.= trim($check_value) . ", ";
                }
            }
            $field = substr($temp, 0, -2);
        }
        if ($authUser['providertype'] == "admin") {
            $c_sql = "SELECT count(*) FROM ipn_logs_listing" . $where;
            $sql = "SELECT row_to_json(d) FROM (SELECT $field FROM ipn_logs_listing" . $where . " ORDER BY " . $sort . " " . $sort_by . ") as d ";
        } else {
            $response['error'] = 1;
            $response['message'] = 'Authentication failed';
        }
        break;

    case '/ipn_logs/?': // To get particular sudopay ipn logs detail based on Id
        $val_arr[] = $r_resource_vars['ipn_logs'];
        $field = "id,ip_id,post_variable";
        if (!empty($r_resource_filters['field'])) {
            $fields = explode(",", $field);
            $check_values = explode(",", $r_resource_filters['field']);
            $temp = "";
            foreach ($check_values as $check_value) {
                if (in_array(trim($check_value) , $fields)) {
                    $temp.= trim($check_value) . ", ";
                }
            }
            $field = substr($temp, 0, -2);
        }
        if ($authUser['providertype'] == "admin") {
            $c_sql = "SELECT count(*) FROM ipn_logs_listing WHERE id = $1";
            $sql = "SELECT row_to_json(d) FROM (SELECT $field FROM ipn_logs_listing WHERE id = $1) as d ";
        } else {
            $response['error'] = 1;
            $response['message'] = 'Authentication failed';
        }
        break;

    default:
        $pluginConditions = array(
            'site.enabled_plugins'
        );
        $enabledPlugins = pg_query_cache("SELECT value FROM settings WHERE name = $1 order by display_order", $pluginConditions);
        $plugin_url = array();
        if (!empty($enabledPlugins[0]['value']) && strpos($enabledPlugins[0]['value'], 'Coupons') !== false) {
            $plugin_url['Coupons'] = array(
                '/coupons',
                '/coupons/?'
            );
        }
        if (!empty($enabledPlugins[0]['value']) && strpos($enabledPlugins[0]['value'], 'CourseWishlist') !== false) {
            $plugin_url['CourseWishlist'] = array(
                '/users/?/course_favourites',
                '/course_favourites',
                '/course_favourites/?'
            );
        }
        if (!empty($enabledPlugins[0]['value']) && strpos($enabledPlugins[0]['value'], 'Withdrawal') !== false) {
            $plugin_url['Withdrawal'] = array(
                '/money_transfer_accounts',
                '/user_cash_withdrawals',
                '/money_transfer_accounts/?',
                '/user_cash_withdrawals/?',
                '/withdrawal_statuses',
                '/withdrawal_statuses/?'
            );
        }
        if (!empty($enabledPlugins[0]['value']) && strpos($enabledPlugins[0]['value'], 'RatingAndReview') !== false) {
            $plugin_url['RatingAndReview'] = array(
                '/course_user_feedbacks/?',
                '/course_user_feedbacks',
                '/courses/?/course_user_feedbacks',
                '/course_users/?/course_user_feedbacks'
            );
        }
        if (!empty($enabledPlugins[0]['value']) && strpos($enabledPlugins[0]['value'], 'SocialLogins') !== false) {
            $plugin_url['SocialLogins'] = array(
                '/providers',
                '/providers/?'
            );
        }
        if (!empty($enabledPlugins[0]['value']) && strpos($enabledPlugins[0]['value'], 'Instructor') !== false) {
            $plugin_url['Instructor'] = array(
                '/me/stats'
            );
        }
        if (!empty($enabledPlugins[0]['value']) && strpos($enabledPlugins[0]['value'], 'Payout') !== false) {
            $plugin_url['Payout'] = array(
                '/payouts'
            );
        }
        if (!empty($enabledPlugins[0]['value']) && strpos($enabledPlugins[0]['value'], 'Translations') !== false) {
            $plugin_url['Translations'] = array(
                '/settings/site_languages'
            );
        }
        if (!empty($enabledPlugins[0]['value']) && strpos($enabledPlugins[0]['value'], 'Subscriptions') !== false) {
            $plugin_url['Subscriptions'] = array(
                '/subscriptions',
                '/subscriptions/?',
                '/user_subscriptions',
                '/user_subscription_logs',
                '/subscription_statuses',
                '/user_subscription_logs/?',
                '/me/subscriptions',
                '/subscription_statuses/?',
                '/users/?/user_subscription_logs'
            );
        }
        if (!empty($enabledPlugins[0]['value']) && strpos($enabledPlugins[0]['value'], 'MOOCAffiliate') !== false) {
            $plugin_url['MOOCAffiliate'] = array(
                '/mooc_affiliate_synchronize'
            );
        }
        if (!empty($enabledPlugins[0]['value']) && strpos($enabledPlugins[0]['value'], 'SudoPay') !== false) {
            $plugin_url['SudoPay'] = array(
                '/sudopay_synchronize',
                '/sudopay_payment_gateways_users',
                '/sudopay_payment_gateways'
            );
        }
        if (!empty($enabledPlugins[0]['value']) && strpos($enabledPlugins[0]['value'], 'CourseCheckout') !== false) {
            $plugin_url['CourseCheckout'] = array(
                '/transactions',
                '/transactions/?'
            );
        }
        foreach ($plugin_url as $plugin_key => $plugin_values) {
            if (in_array($r_resource_cmd, $plugin_values)) {
                $pluginToBePassed = $plugin_key;
                break;
            }
        }
        if (!empty($pluginToBePassed)) {
            require_once APP_PATH . DIRECTORY_SEPARATOR . 'server' . DIRECTORY_SEPARATOR . 'php' . DIRECTORY_SEPARATOR . 'plugins' . DIRECTORY_SEPARATOR . $pluginToBePassed . DIRECTORY_SEPARATOR . 'R' . DIRECTORY_SEPARATOR . 'r.php';
            $passed_values = array();
            $passed_values['sort'] = $sort;
            $passed_values['field'] = $field;
            $passed_values['sort_by'] = $sort_by;
            $passed_values['query_timeout'] = $query_timeout;
            $passed_values['limit'] = $limit;
            $passed_values['conditions'] = $conditions;
            $passed_values['r_resource_cmd'] = $r_resource_cmd;
            $passed_values['r_resource_vars'] = $r_resource_vars;
            $passed_values['r_resource_filters'] = $r_resource_filters;
            $passed_values['authUser'] = $authUser;
            $passed_values['val_arr'] = $val_arr;
            $plugin_return = call_user_func($plugin_key . '_r_get', $passed_values);
            foreach ($plugin_return as $return_plugin_key => $return_plugin_values) {
                $ {
                    $return_plugin_key
                } = $return_plugin_values;
            }
        }
    }
    global $start_time;
    if (!empty($sql)) {
        $_metadata = array();
        if (!empty($c_sql)) {
            if (!empty($count_val_arr_restrict)) {
                $c_result = pg_query_cache($c_sql);
            } else {
                $c_result = pg_query_cache($c_sql, $val_arr);
            }
            $c_data = $c_result[0];
            $page = (!empty($r_resource_filters['page'])) ? $r_resource_filters['page'] : 1;
            if (empty($r_resource_filters['limit']) || (!empty($r_resource_filters['limit']) && $r_resource_filters['limit'] != 'all')) {
                $page_count = (!empty($r_resource_filters['limit'])) ? $r_resource_filters['limit'] : PAGING_COUNT;
                $start = ($page - 1) * $page_count;
                if (!empty($c_data)) {
                    $total_page = ceil($c_data['count'] / $page_count);
                    $showing = (($start + $page_count) > $c_data['count']) ? ($c_data['count'] - $start) : $page_count;
                }
                $_metadata = array(
                    'noOfPages' => $total_page,
                    'currentPage' => $page,
                    'total_records' => $c_data['count'],
                    'limit' => $page_count,
                    'offset' => $start,
                    'maxSize' => 5,
                    'filter_counts' => $filter_counts,
                    'showing' => $showing
                );
                $sql.= ' LIMIT ' . $page_count . ' OFFSET ' . $start;
            } else {
                $_metadata = array(
                    'noOfPages' => 1,
                    'currentPage' => $page,
                    'total_records' => $c_data['count'],
                    'limit' => 'all',
                    'offset' => '',
                    'maxSize' => 10,
                    'filter_counts' => $filter_counts,
                    'showing' => 1
                );
            }
        } else {
            $_metadata = array(
                'noOfPages' => 1,
                'currentPage' => 0,
                'total_records' => 0,
                'limit' => 'all',
                'offset' => '',
                'maxSize' => 10,
                'filter_counts' => $filter_counts,
                'showing' => 1
            );
        }
        $arrayResponse = array(
            //'/users/?',
            //'/pages/?',
            //'/email_templates/?'
            
        );
        if (!empty($r_resource_filters['fields'])) {
            $sql = str_replace('*', $r_resource_filters['fields'], $sql);
        }
        $result = pg_query_cache($sql, $val_arr, $query_timeout);
        if ($result) {
            if ($r_resource_cmd == '/subscriptions/?' && !empty($authUser) && $authUser['providertype'] == 'admin') {
                foreach ($result as $key => $row) {
                    $allowLevelIds = array();
                    $rowData = json_decode($row, true);
                    $instructionalLevelsSubscriptionsConditions = array(
                        $rowData['id']
                    );
                    $instructional_levels_subscriptions = pg_query_cache("SELECT instructional_level_id FROM instructional_levels_subscriptions WHERE subscription_id = $1", $instructionalLevelsSubscriptionsConditions);
                    if (!empty($instructional_levels_subscriptions)) {
                        foreach ($instructional_levels_subscriptions as $instructional_levels_subscription) {
                            $allowLevelIds[] = (int)$instructional_levels_subscription['instructional_level_id'];
                        }
                        $rowData['instruction_levels'] = $allowLevelIds;
                    }
                    $result[$key] = json_encode($rowData);
                }
            }
            if ($r_resource_cmd == '/online_course_lessons/?') {
                $row = json_decode($result[0], true);
                if (($row['is_active'] == true && $row['is_lesson_ready_to_view'] == 1) || (!empty($authUser['id']) && ($authUser['providertype'] == 'admin' || $row['teacher_user_id'] == $authUser['id']))) {
                    $output_bool = true;
                    $res = array();
                    if (!empty($authUser)) {
                        $_conditions = array(
                            $row['id'],
                            $authUser['id']
                        );
                        $lesson_view = r_query("SELECT id FROM online_course_lesson_views WHERE online_course_lesson_id = $1 and user_id = $2", $_conditions);
                        $row['viewed'] = (!empty($lesson_view)) ? '1' : '0';
                    }
                    $result[0] = json_encode($row);
                    $row = json_decode($result[0], true);
                    $_conditions = array(
                        $row['course_id']
                    );
                    $course = r_query("SELECT price, instructional_level_id FROM courses WHERE id = $1", $_conditions);
                    if (((!empty($enabledPlugins[0]['value']) && strpos($enabledPlugins[0]['value'], 'CourseCheckout') !== false) && $course['price'] != 0) || (!empty($enabledPlugins[0]['value']) && strpos($enabledPlugins[0]['value'], 'Subscriptions') !== false)) {
                        if ($row['is_preview'] != 1) { // Check Selected online course lesson has preview option
                            if (!empty($authUser['id'])) { // Check User login or Not
                                $_conditions = array(
                                    $row['course_id'],
                                    $authUser['id']
                                );
                                $course_user = r_query("SELECT user_id FROM courses WHERE id = $1 and user_id = $2", $_conditions);
                                if ($authUser['providertype'] != 'admin' && empty($course_user)) { // If not preview then check Not Admin, Not Course Owner
                                    if ($row['is_active'] == true && $row['is_lesson_ready_to_view'] == 1) {
                                        if (!empty($enabledPlugins[0]['value']) && strpos($enabledPlugins[0]['value'], 'Subscriptions') !== false) {
                                            $_conditions = array(
                                                $authUser['id'],
                                                ConstSubscriptionStatuses::Active
                                            );
                                            $active_subscription = r_query("SELECT * FROM user_subscriptions WHERE user_id = $1 and subscription_status_id = $2", $_conditions);
                                            if (empty($active_subscription)) {
                                                $response['error']['code'] = 1;
                                                $response['error']['message'] = "Payment pending";
                                                echo json_encode($response);
                                                exit;
                                            } else {
                                                $subscriptionsConditions = array(
                                                    $active_subscription['subscription_id']
                                                );
                                                $allowLevelIds = array();
                                                $instructional_levels_subscriptions = pg_query_cache("SELECT instructional_level_id FROM instructional_levels_subscriptions WHERE subscription_id = $1", $subscriptionsConditions);
                                                if (!empty($instructional_levels_subscriptions)) {
                                                    foreach ($instructional_levels_subscriptions as $instructional_levels_subscription) {
                                                        $allowLevelIds[] = (int)$instructional_levels_subscription['instructional_level_id'];
                                                    }
                                                }
                                                if (!in_array($course['instructional_level_id'], $allowLevelIds)) {
                                                    $response['error']['code'] = 2;
                                                    $response['error']['message'] = "Subscription Plan Not Enough";
                                                    echo json_encode($response);
                                                    exit;
                                                }
                                            }
                                        } else if (!empty($enabledPlugins[0]['value']) && strpos($enabledPlugins[0]['value'], 'CourseCheckout') !== false) {
                                            $_conditions = array(
                                                $authUser['id'],
                                                $row['course_id'],
                                                ConstCourseUserStatuses::PaymentPending
                                            );
                                            $pending_course_user_exist = r_query("SELECT count(id) FROM course_users WHERE user_id = $1 and course_id = $2 and course_user_status_id != $3", $_conditions);
                                            if (empty($pending_course_user_exist) || $pending_course_user_exist['count'] == 0) {
                                                $response['error']['code'] = 1;
                                                $response['error']['message'] = "Payment pending";
                                                echo json_encode($response);
                                                exit;
                                            }
                                        }
                                    } else {
                                        $response['error']['code'] = 1;
                                        $response['error']['message'] = "Not Found";
                                        echo json_encode($response);
                                        exit;
                                    }
                                }
                            } else {
                                $response['error']['code'] = 1;
                                $response['error']['message'] = "Authentication failed";
                                echo json_encode($response);
                                exit;
                            }
                        }
                    }
                } else {
                    $response['error']['code'] = 1;
                    $response['error']['message'] = "Not Found";
                    echo json_encode($response);
                    exit;
                }
                $ip = $_SERVER['REMOTE_ADDR'];
                $timestamp = time() + 3600; // one hour valid
                $hash = md5(ACE_SECRET_KEY . 'OnlineCourseLesson' . $row['id'] . $ip . $timestamp . SITE_NAME);
                if ($row['online_lesson_type_id'] == ConstOnlineLessonTypes::Video) {
                    $row['video_url'] = getSiteUri() . '/video/lesson/' . $row['id'] . '/' . $hash . '/' . $timestamp;
                }
                if ($row['online_lesson_type_id'] == ConstOnlineLessonTypes::DownloadableFile) {
                    $row['download_url'] = getSiteUri() . '/client/download/' . $row['id'] . '/' . $hash . '/' . $timestamp;
                }
                $result[0] = json_encode($row);
            }
            if ($r_resource_cmd == '/courses/?/online_course_lessons') {
                if (!empty($result)) {
                    foreach ($result as $key => $res) {
                        $_res = json_decode($res, true);
                        $ip = $_SERVER['REMOTE_ADDR'];
                        $timestamp = time() + 3600; // one hour valid
                        $hash = md5(ACE_SECRET_KEY . 'OnlineCourseLesson' . $_res['id'] . $ip . $timestamp . SITE_NAME);
                        if ($_res['online_lesson_type_id'] == ConstOnlineLessonTypes::Video && $_res['is_lesson_ready_to_view']) {
                            $_res['video_url'] = getSiteUri() . '/video/lesson/' . $_res['id'] . '/' . $hash . '/' . $timestamp;
                        }
                        if ($_res['online_lesson_type_id'] == ConstOnlineLessonTypes::DownloadableFile) {
                            $_res['download_url'] = getSiteUri() . '/client/download/' . $_res['id'] . '/' . $hash . '/' . $timestamp;
                        }
                        $result[$key] = json_encode($_res);
                    }
                }
            }
            if ($r_resource_cmd == '/courses/?') { // To check the course is owned by Current User or Admin
                $output_bool = false;
                $row = json_decode($result[0], true);
                if (!empty($row['promo_video'])) {
                    $ip = $_SERVER['REMOTE_ADDR'];
                    $timestamp = time() + 3600; // one hour valid
                    $hash = md5(ACE_SECRET_KEY . 'CoursePromoVideo' . $row['id'] . $ip . $timestamp . SITE_NAME);
                    $row['video_url'] = getSiteUri() . '/video/promo/' . $row['id'] . '/' . $hash . '/' . $timestamp;
                    $result[0] = json_encode($row);
                    $row = json_decode($result[0], true);
                }
                if (!empty($authUser['id'])) {
                    $_conditions = array(
                        $row['id'],
                        $authUser['id'],
                    );
                    $course_user = r_query("SELECT id FROM course_favourites WHERE course_id = $1 AND user_id = $2 ", $_conditions);
                    $row['is_favourite'] = (!empty($course_user)) ? true : false;
                    $result[0] = json_encode($row);
                }
                if ($row['course_status_id'] != ConstCourseStatuses::Active) {
                    if (!empty($authUser)) {
                        $bool = false;
                        $_conditions = array(
                            $authUser['id'],
                            $r_resource_vars['courses']
                        );
                        $course_user = r_query("SELECT id FROM course_users WHERE user_id = $1 and course_id = $2", $_conditions);
                        if (!empty($course_user)) {
                            $bool = true;
                        }
                        if (($authUser['id'] == $row['user_id']) || $bool || $authUser['providertype'] == 'admin') {
                            $output_bool = true;
                        }
                    }
                } else if ($row['course_status_id'] == ConstCourseStatuses::Active) {
                    $output_bool = true;
                }
                if (!$output_bool) {
                    $response['error'] = 1;
                    $response['message'] = 'Authentication failed';
                    echo json_encode($response);
                    exit;
                }
            }
            if ($r_resource_cmd == '/transactions' || $r_resource_cmd == '/transactions/?') { // To join the foreign table with its id during transactions listing
                foreach ($result as $key => $res) {
                    $_res = json_decode($res, true);
                    $conditions = array(
                        $_res['foreign_id'],
                        $_res['id']
                    );
                    if ($_res['classname'] == 'course_users') {
                        $transactions_data = r_query("SELECT ft.*, tl.*, c.title as course_title FROM transactions_listing tl left join " . $_res['classname'] . " ft on ft.id = $1 left join courses c on c.id = ft.course_id where tl.id = $2", $conditions);
                    } else {
                        $transactions_data = r_query("SELECT ft.*, tl.* FROM transactions_listing tl left join " . $_res['classname'] . " ft on ft.id = $1 where tl.id = $2", $conditions);
                    }
                    if (!empty($transactions_data)) {
                        $result[$key] = json_encode($transactions_data);
                    }
                }
            }
            if ($r_resource_cmd == '/payouts') { // To check the sudopay pament gatways list is connected or not by Current User
                foreach ($result as $key => $res) {
                    $_res = json_decode($res, true);
                    $_conditions = array(
                        $authUser['id'],
                        $_res['sudopay_gateway_id']
                    );
                    $is_connected = false;
                    $data = r_query("SELECT id FROM sudopay_payment_gateways_users WHERE user_id = $1 AND sudopay_payment_gateway_id = $2", $_conditions);
                    if (!empty($data)) {
                        $is_connected = true;
                    }
                    $gateway_details = unserialize($_res['sudopay_gateway_details']);
                    $_res['connect_instruction'] = $gateway_details['connect_instruction'];
                    $_res['is_connected'] = $is_connected;
                    $result[$key] = json_encode($_res);
                }
            }
            if ($r_resource_cmd == '/courses/?/online_course_lessons' && !empty($authUser['id'])) {
                if (!empty($r_resource_filters['view']) && $r_resource_filters['view'] == 'learner_view') {
                    foreach ($result as $key => $res) {
                        $_res = json_decode($res, true);
                        $_conditions = array(
                            $_res['id'],
                            $authUser['id']
                        );
                        $lesson_view = r_query("SELECT id FROM online_course_lesson_views WHERE online_course_lesson_id = $1 and user_id = $2", $_conditions);
                        $_res['viewed'] = (!empty($lesson_view)) ? '1' : '0';
                        $result[$key] = json_encode($_res);
                    }
                }
            }
            if ($r_resource_cmd == '/courses' && !empty($authUser['id'])) { // To check the course  is_favourite
                foreach ($result as $key => $res) {
                    $_res = json_decode($res, true);
                    $_conditions = array(
                        $_res['id'],
                        $authUser['id'],
                    );
                    $course_user = r_query("SELECT id FROM course_favourites WHERE course_id = $1 AND user_id = $2 ", $_conditions);
                    $_res['is_favourite'] = (!empty($course_user)) ? true : false;
                    $result[$key] = json_encode($_res);
                }
            }
            if ($r_resource_cmd == '/users/?/courses/?/related' && !empty($authUser['id'])) { // To check the course related by user is_favourite
                foreach ($result as $key => $res) {
                    $_res = json_decode($res, true);
                    $_conditions = array(
                        $_res['id'],
                        $authUser['id'],
                    );
                    $course_user = r_query("SELECT id FROM course_favourites WHERE course_id = $1 AND user_id = $2 ", $_conditions);
                    $_res['is_favourite'] = (!empty($course_user)) ? true : false;
                    $result[$key] = json_encode($_res);
                }
            }
            $data = array();
            $count = count($result);
            $i = 0;
            header('X-cache-5-end: hit at ' . microtime(true));
            $dif = microtime(true) - $start_time;
            header('X-cache-6-total: hit at ' . $dif);
            if (!in_array($r_resource_cmd, $arrayResponse) && ($count == 1 || $count == 0)) {
                echo '{"_metadata":' . json_encode($_metadata) . ', "data": [';
            } else {
                echo '{"_metadata":' . json_encode($_metadata) . ', "data":';
            }
            foreach ($result as $row) {
                $temp_row = json_decode($row);
                $obj = json_decode($row, true);
                if ($i == 0 && $count > 1) {
                    echo '[';
                }
                echo $row;
                $i++;
                if ($i < $count) {
                    echo ',';
                } else {
                    if ($count > 1) {
                        echo ']';
                    }
                }
            }
            if (!in_array($r_resource_cmd, $arrayResponse) && ($count == 1 || $count == 0)) {
                echo ']';
                if (!empty($token)) {
                    echo ', "token": "' . $token . '"';
                }
                echo '}';
            } else {
                if (!empty($token)) {
                    echo ', "token": "' . $token . '"';
                }
                echo '}';
            }
        } else {
            $response['data'] = array();
            $response['error']['code'] = 0;
            $response['error']['message'] = "No records found";
            $_metadata = array(
                'noOfPages' => 1,
                'currentPage' => 0,
                'total_records' => 0,
                'limit' => 'all',
                'offset' => '',
                'maxSize' => 10,
                'filter_counts' => $filter_counts,
                'showing' => 1
            );
            $response['_metadata'] = $_metadata;
            $individualPageResponse = array(
                '/users/?',
                '/courses/?'
            );
            if (in_array($r_resource_cmd, $individualPageResponse)) {
                header($_SERVER['SERVER_PROTOCOL'] . ' 404 Not Found', true, 404);
            }
            header('X-cache-5-end: hit at ' . microtime(true));
            $dif = microtime(true) - $start_time;
            header('X-cache-6-total: hit at ' . $dif);
            echo json_encode($response);
        }
    } else {
        header('X-cache-5-end: hit at ' . microtime(true));
        $dif = microtime(true) - $start_time;
        header('X-cache-6-total: hit at ' . $dif);
        echo json_encode($response);
    }
}
/**
 * Common method to handle all POST request
 *
 * @param string $r_resource_cmd     URL
 * @param array  $r_resource_vars    Array generated from URL
 * @param array  $r_resource_filters Array generated from URL query string
 * @param array  $r_post             Post data
 *
 * @return mixed
 */
function r_post($r_resource_cmd, $r_resource_vars, $r_resource_filters, $r_post)
{
    global $r_debug, $authUser, $themeBaseFolder;
    $emailFindReplace = $response = array();
    $json = $sql = $is_return_vlaue = false;
    // Gettting Enabled Plugin List
    if ($r_resource_cmd === '/course_users' || $r_resource_cmd === '/courses') {
        $pluginConditions = array(
            'site.enabled_plugins'
        );
        $enabledPlugins = pg_query_cache("SELECT value FROM settings WHERE name = $1 order by display_order", $pluginConditions);
    }
    if ($r_resource_cmd === '/order/?' || $r_resource_cmd === '/subscriptions/payment') {
        $settingConditions = array(
            'site.currency_code'
        );
        $siteCurrencyCode = pg_query_cache("SELECT value FROM settings WHERE name = $1 order by display_order", $settingConditions);
    }
    switch ($r_resource_cmd) {
    case '/auth': // For Social login
        $response = social_auth_login($r_resource_filters['type'], $r_post);
        break;

    case '/image_upload': // To Upload the all type of files
        try {
            $path = getSiteUri('upload');
            if (!empty($_POST['course_id'])) {
                $mediadir = APP_PATH . DIRECTORY_SEPARATOR . 'media' . DIRECTORY_SEPARATOR . 'temp' . DIRECTORY_SEPARATOR . 'Course' . DIRECTORY_SEPARATOR . $_POST['course_id'];
                $save_path = $path . DIRECTORY_SEPARATOR . 'media' . DIRECTORY_SEPARATOR . 'temp' . DIRECTORY_SEPARATOR . $_POST['course_id'];
            } else {
                $mediadir = APP_PATH . DIRECTORY_SEPARATOR . 'media' . DIRECTORY_SEPARATOR . 'temp' . DIRECTORY_SEPARATOR . $authUser['id'];
                $save_path = $path . DIRECTORY_SEPARATOR . 'media' . DIRECTORY_SEPARATOR . 'temp' . DIRECTORY_SEPARATOR . $authUser['id'];
            }
            if (!file_exists($mediadir)) {
                mkdir($mediadir, 0777, true);
            }
            $file = (!empty($_FILES['attachment'])) ? $_FILES['attachment'] : $_FILES['file'];
            $mimeType = explode(".", $file['name']);
            $response['error']['code'] = 0;
            if ($file['error'] == 0) {
                // Check extension and through error message
                if ((empty($_POST['type'])) && (($file["type"] == "image/gif") || ($file["type"] == "image/jpeg") || ($file["type"] == "image/jpg") || ($file["type"] == "image/png"))) {
                    $file['name'] = removeSpaceInName($file['name']);
                    $tmp_file_name = $file['tmp_name'];
                    $info = pathinfo($file['name']);
                    $filename = $info['filename'];
                    $extension = $info['extension'];
                    $new_filename = $filename . '.' . $extension;
                    $saveAs = $mediadir . DIRECTORY_SEPARATOR . $filename . '.' . $extension;
                    if (file_exists($saveAs)) {
                        $count = 1;
                        while (file_exists($mediadir . DIRECTORY_SEPARATOR . $filename . '_' . $count . '.' . $extension)) {
                            $count++;
                        }
                        $new_filename = $filename . '_' . $count . '.' . $extension;
                        $saveAs = $mediadir . DIRECTORY_SEPARATOR . $filename . '_' . $count . '.' . $extension;
                    }
                    if (move_uploaded_file($tmp_file_name, $saveAs)) {
                        $picture_url = $save_path . DIRECTORY_SEPARATOR . $new_filename;
                    }
                    if (!empty($file['error'])) {
                        $response['error']['reason'] = $file['error'];
                    }
                    $response['picture_url'] = $picture_url;
                    $response['filename'] = $new_filename;
                } else if (!empty($_POST['type']) && $_POST['type'] == 'video') {
                    $video_formats = array(
                        'video/mpeg4', //.mpeg
                        'video/mp4', // MPEG-4
                        'video/wmv', // .wmv
                        'video/x-ms-wmv', // .wmv
                        'video/flv', // .flv
                        'video/x-flv', // .flv
                        'flv-application/octet-stream', //.flv
                        'application/octet-stream', //.flv
                        'video/3gpp',
                        'video/webm',
                        'video/mpeg', // .mpeg
                        'video/mov', // .mov
                        'video/quicktime', // .mov and .moov
                        'video/x-sgi-movie', // .movie
                        'video/avi', // .avi
                        'application/x-troff-msvideo', //.avi
                        'video/msvideo', //.avi
                        'video/x-msvideo', //.avi
                        
                    );
                    $max_video_size = r_query("SELECT value FROM settings WHERE name ='video.max_size_to_allow_video_file'");
                    $kilobyte = 1024;
                    $megabyte = $kilobyte * 1024;
                    $current_file_size = round($file["size"] / $megabyte, 2);
                    if (in_array($file["type"], $video_formats)) {
                        if (empty($max_video_size['value']) || (!empty($max_video_size['value']) && $current_file_size <= $max_video_size['value'])) {
                            $file['name'] = removeSpaceInName($file['name']);
                            $tmp_file_name = $file['tmp_name'];
                            $info = pathinfo($file['name']);
                            $filename = $info['filename'];
                            $extension = $info['extension'];
                            $new_filename = $filename . '.' . $extension;
                            $saveAs = $mediadir . DIRECTORY_SEPARATOR . $filename . '.' . $extension;
                            if (file_exists($saveAs)) {
                                $count = 1;
                                while (file_exists($mediadir . DIRECTORY_SEPARATOR . $filename . '_' . $count . '.' . $extension)) {
                                    $count++;
                                }
                                $new_filename = $filename . '_' . $count . '.' . $extension;
                                $saveAs = $mediadir . DIRECTORY_SEPARATOR . $filename . '_' . $count . '.' . $extension;
                            }
                            if (move_uploaded_file($tmp_file_name, $saveAs)) {
                                $picture_url = $save_path . DIRECTORY_SEPARATOR . $new_filename;
                            }
                            if (!empty($file['error'])) {
                                $response['error']['reason'] = $file['error'];
                            }
                            $response['picture_url'] = $picture_url;
                            $response['filename'] = $new_filename;
                        } else {
                            $response['error']['code'] = 3;
                            $response['error']['message'] = "The uploaded file size exceeds the allowed size.";
                        }
                    } else {
                        $response['error']['code'] = 1;
                        $response['error']['message'] = "File couldn't be uploaded. Allowed extensions: mov, mpeg4, avi, wmv, mpeg, flv, 3gpp, webm, mp4.";
                    }
                } else if (!empty($_POST['type']) && $_POST['type'] == 'file') {
                    $file['name'] = removeSpaceInName($file['name']);
                    $tmp_file_name = $file['tmp_name'];
                    $info = pathinfo($file['name']);
                    $filename = $info['filename'];
                    $extension = $info['extension'];
                    $new_filename = $filename . '.' . $extension;
                    $saveAs = $mediadir . DIRECTORY_SEPARATOR . $filename . '.' . $extension;
                    if (file_exists($saveAs)) {
                        $count = 1;
                        while (file_exists($mediadir . DIRECTORY_SEPARATOR . $filename . '_' . $count . '.' . $extension)) {
                            $count++;
                        }
                        $new_filename = $filename . '_' . $count . '.' . $extension;
                        $saveAs = $mediadir . DIRECTORY_SEPARATOR . $filename . '_' . $count . '.' . $extension;
                    }
                    if (move_uploaded_file($tmp_file_name, $saveAs)) {
                        $picture_url = $save_path . DIRECTORY_SEPARATOR . $new_filename;
                    }
                    if (!empty($file['error'])) {
                        $response['error']['reason'] = $file['error'];
                    }
                    $response['picture_url'] = $picture_url;
                    $response['filename'] = $new_filename;
                } else {
                    $response['error']['code'] = 2;
                    $response['error']['message'] = "File couldn't be uploaded. Allowed extensions: gif, jpeg, jpg, png.";
                }
            } else {
                $phpFileUploadErrors = array(
                    0 => 'There is no error, the file uploaded with success',
                    1 => 'The uploaded file size exceeds the allowed size. So please update less than ' . ini_get('upload_max_filesize') ,
                    2 => 'The uploaded file size exceeds the allowed size. So please update less than ' . ini_get('upload_max_filesize') ,
                    3 => 'The uploaded file was only partially uploaded',
                    4 => 'No file was uploaded',
                    6 => 'Missing a temporary folder',
                    7 => 'Failed to write file to disk.',
                    8 => 'A PHP extension stopped the file upload.',
                );
                $response['error']['code'] = 1;
                $response['error']['message'] = $phpFileUploadErrors[$file['error']];
            }
        }
        catch(Exception $e) {
            error_log('Caught exception : ' . $e->getMessage() . " \n", '3', APP_PATH . DIRECTORY_SEPARATOR . 'tmp' . DIRECTORY_SEPARATOR . 'logs' . DIRECTORY_SEPARATOR . 'exception_log.log');
            $response = array(
                'error' => array(
                    'code' => 1,
                    'message' => 'Connection Failed'
                )
            );
        }
        break;

    case '/order/?': // To order the payment with Sudopay payment gateways based on Course Id
        $course_id = $r_resource_vars['order'];
        $user_id = $authUser['id'];
        if (!empty($r_post['coupon_code'])) {
            require_once APP_PATH . DIRECTORY_SEPARATOR . 'server' . DIRECTORY_SEPARATOR . 'php' . DIRECTORY_SEPARATOR . 'plugins' . DIRECTORY_SEPARATOR . 'Coupons' . DIRECTORY_SEPARATOR . 'functions.php';
            // Function calling in Coupons Plugin functions.php file
            $response = verifyAndUseCoupon($course_id, $user_id, $r_post['coupon_code']);
        } else if (!empty($r_post['paypal_gateway_enabled'])) {
            require_once APP_PATH . DIRECTORY_SEPARATOR . 'server' . DIRECTORY_SEPARATOR . 'php' . DIRECTORY_SEPARATOR . 'plugins' . DIRECTORY_SEPARATOR . 'PayPal' . DIRECTORY_SEPARATOR . 'functions.php';
            // Function calling in PayPal Plugin functions.php file
            $response = makePayPalRequestForPayment($course_id, $user_id, $siteCurrencyCode[0]['value']);
        } else if (!empty($r_post['sudopay_gateway_id'])) { //sudopay gateways enabled
            require_once APP_PATH . DIRECTORY_SEPARATOR . 'server' . DIRECTORY_SEPARATOR . 'php' . DIRECTORY_SEPARATOR . 'plugins' . DIRECTORY_SEPARATOR . 'SudoPay' . DIRECTORY_SEPARATOR . 'functions.php';
            // Function calling in SudoPay Plugin functions.php file
            $response = makeSudoPayRequestForPayment($course_id, $user_id, $siteCurrencyCode[0]['value'], $r_post);
        }
        $sql = false;
        break;

    case '/users/video_upload': // To Upload the all type of video
        // @Todo
        break;

    case '/users/login': // To user login
        $is_login = false;
        $user = array();
        $conditions = array(
            $r_post['email']
        );
        $log_user = r_query("SELECT email, password FROM users WHERE (email = $1)", $conditions);
        if (!empty($log_user)) {
            $table_name = 'users';
            $r_post['password'] = crypt($r_post['password'], $log_user['password']);
            $conditions = array(
                $log_user['email'],
                $r_post['password']
            );
            $user = r_query("SELECT * FROM users WHERE LOWER(email) = $1 AND password = $2", $conditions);
            if (!empty($user)) {
                if ($user['isemailverified']) {
                    $post_val = array(
                        'grant_type' => 'password',
                        'username' => $user['username'],
                        'password' => $r_post['password'],
                        'client_id' => OAUTH_CLIENTID,
                        'client_secret' => OAUTH_CLIENT_SECRET
                    );
                    $response = getToken($post_val);
                    $ip_id = r_saveIp();
                    $user_agent = !empty($_SERVER['HTTP_USER_AGENT']) ? $_SERVER['HTTP_USER_AGENT'] : '';
                    $user_logins_data['user_id'] = $user['id'];
                    if (!empty($ip_id)) {
                        $user_logins_data['user_login_ip_id'] = $ip_id;
                    }
                    $user_logins_data['user_agent'] = $user_agent;
                    $user_logins_data['provider_type'] = $user['providertype'];
                    $result = pg_execute_insert('user_logins', $user_logins_data);
                    $users_update_data[] = date('Y-m-d H:i:s');
                    $users_update_data[] = $user['id'];
                    $sql_query = "UPDATE users SET (modified, last_logged_in_time, user_login_count) = ($1, $1, user_login_count + 1) WHERE id = $2";
                    if (!empty($ip_id)) {
                        $users_update_data[] = $ip_id;
                        $sql_query = "UPDATE users SET (modified, last_logged_in_time, user_login_count, last_login_ip_id) = ($1, $1, user_login_count + 1, $3) WHERE id = $2";
                    }
                    $result = pg_execute_query($sql_query, $users_update_data);
                    $authUser = array_merge($user);
                    if (!isset($response['error'])) {
                        $response['error'] = array();
                    }
                    $response['error']['code'] = 0;
                    $response['user'] = $user;
                    $response['user']['is_show_fb_block'] = false;
                    $response['user']['is_show_playlist_block'] = false;
                    $data = array(
                        "id" => $user["id"],
                        "email" => $user["email"]
                    );
                } else {
                    $response = array(
                        'error' => array(
                            'code' => 7,
                            'message' => 'Account has not been activated. Please find activation link in your email.'
                        )
                    );
                }
            } else {
                $response = array(
                    'error' => array(
                        'code' => 1,
                        'message' => "Sorry, login failed. Email or Password is incorrect."
                    )
                );
            }
        } else {
            $response = array(
                'error' => array(
                    'code' => 1,
                    'message' => "Sorry, login failed. Email or Password is incorrect."
                )
            );
        }
        break;

    case '/users/register': // To users register
        unset($r_post['confirm_password']);
        $table_name = 'users';
        $conditions = array(
            $r_post['email']
        );
        $user = r_query("SELECT email FROM users WHERE (LOWER(email) = LOWER($1))", $conditions);
        if (!$user) {
            $sql = true;
            $user_password = $r_post['password'];
            require_once APP_PATH . DIRECTORY_SEPARATOR . 'server' . DIRECTORY_SEPARATOR . 'php' . DIRECTORY_SEPARATOR . 'libs' . DIRECTORY_SEPARATOR . 'Inflector.php';
            $inflector = new Inflector();
            $r_post['username'] = checkUserName($inflector->slug($r_post['displayname'], '-'));
            $r_post['register_ip_id'] = r_saveIp();
            if (empty($r_post['providertype'])) {
                $r_post['providertype'] = 'userpass';
            }
            $r_post['password'] = getCryptHash($r_post['password']);
            if (empty($r_post['tos'])) {
                unset($r_post['tos']);
            }
        } else {
            $response['error']['code'] = 1;
            $response['error']['message'] = 'Sorry, registration failed.  Email already exist.';
        }
        break;

    case '/users/forgotpassword': //To change the current password for forgot password option
        $conditions = array(
            $r_post['email']
        );
        $user = r_query("SELECT id, email, displayname FROM users WHERE email = $1", $conditions);
        if ($user) {
            $password = uniqid();
            $new_passowrd = getCryptHash($password);
            $data = array(
                date('Y-m-d H:i:s') ,
                $new_passowrd,
                $user['id']
            );
            pg_execute_query("UPDATE users SET (modified, password) = ($1, $2) WHERE id = $3", $data);
            $admin_email = r_query("SELECT value FROM settings WHERE name = 'site.contact_email'");
            $emailFindReplace = array(
                'mail' => 'Forgot Password',
                '##USERNAME##' => $user['displayname'],
                '##PASSWORD##' => $password,
                'to' => $user['email'],
                'from' => $admin_email['value'],
            );
            $response = r_mail($emailFindReplace);
            $response['error']['code'] = 0;
            $response['error']['message'] = 'Mail Sent Successfully';
        } else {
            $response['error']['code'] = 1;
            $response['error']['message'] = 'Given Email is not existing';
        }
        break;

    case '/users/changepassword': //To change password by user
        $conditions = array(
            $authUser['id']
        );
        $user = r_query("SELECT email,password FROM users WHERE id = $1", $conditions);
        if ($user) {
            $cry_old_pass = crypt($r_post['old_password'], $user['password']);
            if ($user['password'] == $cry_old_pass || $authUser['providertype'] == 'admin') {
                $new_passowrd = getCryptHash($r_post['new_password']);
                $data = array(
                    $new_passowrd,
                    $authUser['id']
                );
                $result = pg_execute_query("UPDATE users SET password = $1 WHERE id = $2", $data);
                if ($authUser['id'] == 1) {
                    $emailFindReplace = array(
                        'to' => $user['email'],
                        'mail' => 'Admin Change Password',
                        '##PASSWORD##' => $r_post['password']
                    );
                    $response = r_mail($emailFindReplace);
                } else {
                    $response = array(
                        'error' => array(
                            'code' => 0
                        )
                    );
                    $response['error']['message'] = 'Password Changed Successfully';
                }
            } else {
                $response = array(
                    'error' => array(
                        'code' => 1
                    )
                );
                $response['error']['message'] = 'Old password doesn\'t Match';
            }
        }
        break;

    case '/course_users': // To add the course users with Course based on Current User
        $isAllowToInsertRecord = 0;
        $conditions = array(
            $r_post['course_id'],
        );
        $course = r_query("SELECT id,instructional_level_id, price, user_id FROM courses WHERE id = $1", $conditions);
        if (!empty($course)) {
            if ($authUser['id'] != $course['user_id']) {
                if (!empty($enabledPlugins[0]['value']) && strpos($enabledPlugins[0]['value'], 'Subscriptions') !== false) {
                    // Getting this course's access level subscription plans
                    $conditions = array(
                        $course['instructional_level_id']
                    );
                    $instructional_levels_subscriptions = pg_query_cache("SELECT subscription_id FROM instructional_levels_subscriptions WHERE instructional_level_id = $1", $conditions);
                    $allowedSubscriptionPlans = array();
                    if (!empty($instructional_levels_subscriptions)) {
                        foreach ($instructional_levels_subscriptions as $instructional_levels_subscription) {
                            $allowedSubscriptionPlans[] = $instructional_levels_subscription['subscription_id'];
                        }
                    }
                    // Getting user's subscription records
                    $conditions = array(
                        $authUser['id'],
                        ConstSubscriptionStatuses::Active
                    );
                    $user_subscriptions = r_query("SELECT subscription_id FROM user_subscriptions WHERE user_id = $1 AND subscription_status_id = $2", $conditions);
                    if (!empty($allowedSubscriptionPlans) && !empty($user_subscriptions) && in_array($user_subscriptions['subscription_id'], $allowedSubscriptionPlans)) {
                        $isAllowToInsertRecord = 1;
                    } else {
                        $response['error']['code'] = 1;
                        $response['error']['message'] = "Your subscription plan is not enough to access this instruction level course.";
                    }
                } else if (!empty($enabledPlugins[0]['value']) && strpos($enabledPlugins[0]['value'], 'CourseCheckout') !== false && empty($course['price'])) {
                    $isAllowToInsertRecord = 1;
                } else {
                    $isAllowToInsertRecord = 1; // If Subscription and payment plugin is disabled... then site is runing as free
                    
                }
                if ($isAllowToInsertRecord) {
                    $courseUserConditions = array(
                        $course['id'],
                        $authUser['id']
                    );
                    $course_user = r_query("SELECT id FROM course_users WHERE course_id = $1 and user_id = $2", $courseUserConditions);
                    if (empty($course_user)) {
                        $table_name = 'course_users';
                        $r_post['course_user_status_id'] = ConstCourseUserStatuses::NotStarted;
                        $r_post['booked_date'] = date('Y-m-d H:i:s');
                        $sql = true;
                    } else {
                        $response = array(
                            'id' => $course_user['id']
                        );
                    }
                } else {
                    $response['error']['code'] = 1;
                    $response['error']['message'] = "Access Denied";
                }
            } else {
                $response['error']['code'] = 1;
                $response['error']['message'] = "You can't take your own course.";
            }
        } else {
            $response['error']['code'] = 1;
            $response['error']['message'] = "Authentication Failed";
        }
        break;

    case '/users': // To add user details
        if ($authUser['providertype'] == 'admin') {
            $table_name = 'users';
            $conditions = array(
                $r_post['email']
            );
            $user = r_query("SELECT email FROM users WHERE (LOWER(email) = LOWER($1))", $conditions);
            if (!$user) {
                $sql = true;
                $user_password = $r_post['password'];
                require_once APP_PATH . DIRECTORY_SEPARATOR . 'server' . DIRECTORY_SEPARATOR . 'php' . DIRECTORY_SEPARATOR . 'libs' . DIRECTORY_SEPARATOR . 'Inflector.php';
                $inflector = new Inflector();
                $r_post['username'] = checkUserName($inflector->slug($r_post['displayname'], '-'));
                $r_post['password'] = getCryptHash($r_post['password']);
            } else {
                $response['error']['code'] = 1;
                $response['error']['message'] = 'Sorry, registration failed.  Email already exist.';
            }
        }
        break;

    case '/course_users/?/archive': // To archieve the course based on course id
        $course_id = $r_resource_vars['course_users'];
        $sql = false;
        $conditions = array(
            $course_id,
            $authUser['id']
        );
        $course_user = r_query("SELECT course_user_status_id FROM course_users WHERE id = $1 and user_id = $2", $conditions);
        if ($course_user) {
            if ($course_user['course_user_status_id'] != ConstCourseUserStatuses::Archived) {
                $conditions[] = ConstCourseUserStatuses::Archived;
                $conditions[] = date('Y-m-d H:i:s');
                pg_execute_query("UPDATE course_users SET (modified, course_user_status_id) = ($4, $3) WHERE id = $1 and user_id = $2", $conditions);
                $response['error']['code'] = 0;
                $response['error']['message'] = "Archived Successfully";
            } else {
                $response['error']['code'] = 1;
                $response['error']['message'] = "Already you're archived this course";
            }
        } else {
            $response['error']['code'] = 1;
            $response['error']['message'] = "Authentication Failed";
        }
        break;

    case '/cities': // To add cities details
        if (!empty($authUser) && $authUser['providertype'] == 'admin') {
            $table_name = 'cities';
            $sql = true;
        } else {
            $response['error']['code'] = 1;
            $response['error']['message'] = 'Authentication failed';
        }
        break;

    case '/contacts': // To add contacts details
        $table_name = 'contacts';
        $r_post['ip_id'] = r_saveIp();
        if (!empty($authUser)) {
            $r_post['user_id'] = $authUser['id'];
        }
        $sql = true;
        break;

    case '/countries': // To add countries details
        $sql = true;
        $table_name = 'countries';
        break;

    case '/states': // To add states details
        if (!empty($authUser) && $authUser['providertype'] == 'admin') {
            $table_name = 'states';
            $sql = true;
        } else {
            $response['error']['code'] = 1;
            $response['error']['message'] = 'Authentication failed';
        }
        break;

    case '/categories': // To add categories details
        if (!empty($authUser) && $authUser['providertype'] == 'admin') {
            $field = "parent_id,name,is_active,description";
            $fields = explode(",", $field);
            $post_values = $r_post;
            if (empty($r_post['parent_id'])) {
                unset($post_values['parent_id']);
            }
            $r_post = array();
            foreach ($post_values as $key => $value) {
                if (in_array(trim($key) , $fields)) {
                    $r_post[$key] = $value;
                }
            }
            $table_name = 'categories';
            $sql = true;
        } else {
            $response['error']['code'] = 1;
            $response['error']['message'] = 'Authentication failed';
        }
        break;

    case '/pages': // To add pages details
        if (!empty($authUser) && $authUser['providertype'] == 'admin') {
            if (!empty($r_post['type']) && $r_post['type'] == 'bulk') {
                $r_post = (array)$r_post;
                $slug = $r_post['page_slug'];
                unset($r_post['type']);
                unset($r_post['page_slug']);
                foreach ($r_post as $key => $value) {
                    $data = array();
                    $data['title'] = !empty($value->title) ? $value->title : '';
                    $data['content'] = !empty($value->content) ? $value->content : '';
                    $data['language_id'] = $key;
                    $data['slug'] = $slug;
                    pg_execute_insert('pages', $data);
                }
                $sql = false;
                $response['error']['code'] = 0;
                $response['error']['message'] = 'Success';
            } else {
                $sql = true;
            }
        } else {
            $response['error']['code'] = 1;
            $response['error']['message'] = 'Authentication failed';
        }
        break;

    case '/courses': // To add courses details
        $table_name = 'courses';
        // For admin, have option to choose instructor in PUT action
        if (empty($r_post['user_id']) && $authUser['providertype'] !== 'admin') {
            $r_post['user_id'] = $authUser['id'];
        }
        if (!empty($authUser) && ((!empty($enabledPlugins[0]['value']) && strpos($enabledPlugins[0]['value'], 'Instructor') !== false) || $authUser['providertype'] == 'admin')) {
            $field = "user_id,title,subtitle,parent_category_id,category_id,description,credentials,price,what_actions_students_have_to_perform_before_begin,students_will_be_able_to,who_should_take_this_course_and_who_should_not,instructional_level_id,language_id,course_status_id,course_image,image_hash";
            $fields = explode(",", $field);
            $post_values = $r_post;
            $r_post = array();
            foreach ($post_values as $key => $value) {
                if (in_array(trim($key) , $fields)) {
                    $r_post[$key] = $value;
                    if ($key === 'title') {
                        require_once APP_PATH . DIRECTORY_SEPARATOR . 'server' . DIRECTORY_SEPARATOR . 'php' . DIRECTORY_SEPARATOR . 'libs' . DIRECTORY_SEPARATOR . 'Inflector.php';
                        $inflector = new Inflector();
                        $r_post['slug'] = $inflector->slug($value, '-');
                    }
                }
            }
            $sql = true;
        } else {
            $response['error']['code'] = 1;
            $response['error']['message'] = 'Authentication failed';
        }
        break;

    case '/instructional_levels': // To add instructional levels details
        $table_name = 'instructional_levels';
        $sql = true;
        break;

    case '/languages': // To add languages details
        $table_name = 'languages';
        if ($authUser['providertype'] == 'admin') {
            $sql = true;
        } else {
            $response['error']['code'] = 1;
            $response['error']['message'] = "Authentication failed";
        }
        break;

    case '/online_course_lessons': // To add online course lessons details
        $conditions = array(
            $r_post['course_id'],
            $authUser['id']
        );
        $course_user = r_query("SELECT id FROM courses WHERE id = $1 and user_id = $2", $conditions);
        if ($authUser['providertype'] == 'admin' || $course_user) {
            $sql = true;
            if ($r_post['online_lesson_type_id'] == ConstOnlineLessonTypes::VideoExternal) {
                require_once APP_PATH . DIRECTORY_SEPARATOR . 'server' . DIRECTORY_SEPARATOR . 'php' . DIRECTORY_SEPARATOR . 'plugins' . DIRECTORY_SEPARATOR . 'VideoExternalEmbedLessons' . DIRECTORY_SEPARATOR . 'functions.php';
                $checkIsEmbedValid = getVideoEmbedCode($r_post['embed_code']);
                if ($checkIsEmbedValid === 0) {
                    $sql = false;
                    $response['error']['code'] = 2;
                    $response['error']['message'] = 'Site couldn\'t process your video URL. Please enter valid URL or some other URL.';
                } else {
                    $r_post['embed_code'] = $checkIsEmbedValid;
                }
            }
            $r_post['user_id'] = $authUser['id'];
            $table_name = 'online_course_lessons';
        } else {
            $response['error']['code'] = 1;
            $response['error']['message'] = 'Authentication failed';
        }
        break;

    case '/online_course_lesson_views': // To add online course lessons views details
        if (!empty($authUser)) {
            $sql = false;
            $conditions = array(
                $authUser['id'],
                $r_post['course_id'],
                $r_post['online_course_lesson_id'],
                $r_post['course_user_id']
            );
            $course_user = r_query("SELECT id FROM online_course_lesson_views WHERE user_id = $1 and course_id =$2 and online_course_lesson_id = $3 and course_user_id = $4", $conditions);
            if (empty($course_user)) {
                $r_post['user_id'] = $authUser['id'];
                $table_name = 'online_course_lesson_views';
                $sql = true;
            }
        }
        break;

    case '/process_ipn/?': // To add process ipn details based on Id
        //To Do
        break;

    default:
        $pluginConditions = array(
            'site.enabled_plugins'
        );
        $enabledPlugins = pg_query_cache("SELECT value FROM settings WHERE name = $1 order by display_order", $pluginConditions);
        $plugin_url = array();
        if (!empty($enabledPlugins[0]['value']) && strpos($enabledPlugins[0]['value'], 'Coupons') !== false) {
            $plugin_url['Coupons'] = array(
                '/coupons'
            );
        }
        if (!empty($enabledPlugins[0]['value']) && strpos($enabledPlugins[0]['value'], 'CourseWishlist') !== false) {
            $plugin_url['CourseWishlist'] = array(
                '/course_favourites'
            );
        }
        if (!empty($enabledPlugins[0]['value']) && strpos($enabledPlugins[0]['value'], 'Withdrawal') !== false) {
            $plugin_url['Withdrawal'] = array(
                '/money_transfer_accounts',
                '/user_cash_withdrawals'
            );
        }
        if (!empty($enabledPlugins[0]['value']) && strpos($enabledPlugins[0]['value'], 'RatingAndReview') !== false) {
            $plugin_url['RatingAndReview'] = array(
                '/course_user_feedbacks'
            );
        }
        if (!empty($enabledPlugins[0]['value']) && strpos($enabledPlugins[0]['value'], 'SocialLogins') !== false) {
            $plugin_url['SocialLogins'] = array(
                '/users/social_login'
            );
        }
        if (!empty($enabledPlugins[0]['value']) && strpos($enabledPlugins[0]['value'], 'Subscriptions') !== false) {
            $plugin_url['Subscriptions'] = array(
                '/subscriptions/payment',
                '/subscriptions',
                '/user_subscription_logs',
                '/user_subscriptions'
            );
        }
        if (!empty($enabledPlugins[0]['value']) && strpos($enabledPlugins[0]['value'], 'Payout') !== false) {
            $plugin_url['Payout'] = array(
                '/payouts_connect'
            );
        }
        foreach ($plugin_url as $plugin_key => $plugin_values) {
            if (in_array($r_resource_cmd, $plugin_values)) {
                $pluginToBePassed = $plugin_key;
                break;
            }
        }
        if (!empty($pluginToBePassed)) {
            require_once APP_PATH . DIRECTORY_SEPARATOR . 'server' . DIRECTORY_SEPARATOR . 'php' . DIRECTORY_SEPARATOR . 'plugins' . DIRECTORY_SEPARATOR . $pluginToBePassed . DIRECTORY_SEPARATOR . 'R' . DIRECTORY_SEPARATOR . 'r.php';
            $passed_values = array();
            $passed_values['sql'] = $sql;
            $passed_values['r_resource_cmd'] = $r_resource_cmd;
            $passed_values['r_resource_vars'] = $r_resource_vars;
            $passed_values['r_resource_filters'] = $r_resource_filters;
            $passed_values['authUser'] = $authUser;
            $passed_values['r_post'] = $r_post;
            if (!empty($table_name)) {
                $passed_values['table_name'] = $table_name;
            }
            if (!empty($siteCurrencyCode)) {
                $passed_values['siteCurrencyCode'] = $siteCurrencyCode;
            }
            if (!empty($enabledPlugins)) {
                $passed_values['enabledPlugins'] = $enabledPlugins;
            }
            $plugin_return = call_user_func($plugin_key . '_r_post', $passed_values);
            foreach ($plugin_return as $return_plugin_key => $return_plugin_values) {
                $ {
                    $return_plugin_key
                } = $return_plugin_values;
            }
        }
    }
    if (!empty($sql)) {
        $result = pg_execute_insert($table_name, $r_post);
        if (!empty($result)) {
            $row = $result;
            $response['id'] = $row['id'];
            if ($is_return_vlaue) {
                $response[$table_name] = $row;
            }
            if ($r_resource_cmd == '/users/register') { // To post the Email with Activation URL to the User during Register
                $post_val = array(
                    'grant_type' => 'password',
                    'username' => $row['username'],
                    'password' => $user_password,
                    'client_id' => OAUTH_CLIENTID,
                    'client_secret' => OAUTH_CLIENT_SECRET
                );
                $response = getToken($post_val);
                $emailFindReplace['##USERNAME##'] = $r_post['displayname'];
                $emailFindReplace['##ACTIVATION_URL##'] = getSiteUri() . "/#!/users/activation/" . $row['id'] . "/" . md5($r_post['displayname']) . '/' . $response['access_token'];
                $emailFindReplace['to'] = $r_post['email'];
                $emailFindReplace['mail'] = 'Activation Request';
                r_mail($emailFindReplace);
                $emailFindReplace['##USEREMAIL##'] = $r_post['email'];
                $admin_email = r_query("SELECT value FROM settings WHERE name = 'site.contact_email'");
                $emailFindReplace['to'] = $admin_email['value'];
                $emailFindReplace['mail'] = 'New User Join';
                r_mail($emailFindReplace);
                $response['user'] = $row;
                $response['error']['code'] = 0;
                $response['error']['message'] = 'Success';
            }
            if ($r_resource_cmd == '/users') { // To send the status of Users during users add
                $emailFindReplace['##USERNAME##'] = $r_post['displayname'];
                $emailFindReplace['##PASSWORD##'] = $user_password;
                $emailFindReplace['to'] = $r_post['email'];
                $emailFindReplace['mail'] = 'Admin User Add';
                r_mail($emailFindReplace);
            }
            if ($r_resource_cmd == '/contacts') {
                $emailFindReplace['to'] = $r_post['email'];
                $emailFindReplace['##MESSAGE##'] = $r_post['message'];
                $emailFindReplace['##SUBJECT##'] = $r_post['subject'];
                $emailFindReplace['##USERNAME##'] = $r_post['first_name'] . ' ' . $r_post['last_name'];
                $emailFindReplace['##CONTACT_URL##'] = getSiteUri() . '/#!/contactus';
                $emailFindReplace['mail'] = 'Contact Us Auto Reply';
                r_mail($emailFindReplace);
                $admin_email = r_query("SELECT value FROM settings WHERE name = 'site.contact_email'");
                $emailFindReplace['to'] = $admin_email['value'];
                $emailFindReplace['mail'] = 'Contact Us';
                r_mail($emailFindReplace);
            }
            if ($r_resource_cmd == '/courses') { // To move the Course Image from temp folder to Particular course folder
                if (!empty($r_post['user_id']) && $r_post['user_id'] != null) {
                    _updateIsTeacher($r_post['user_id']);
                }
                if (!empty($r_post['course_image'])) {
                    $temp_path = dirname(dirname(dirname(dirname(__FILE__)))) . DIRECTORY_SEPARATOR . 'media' . DIRECTORY_SEPARATOR . 'temp' . DIRECTORY_SEPARATOR . $authUser['id'] . DIRECTORY_SEPARATOR;
                    $mediadir = dirname(dirname(dirname(dirname(__FILE__)))) . DIRECTORY_SEPARATOR . 'media' . DIRECTORY_SEPARATOR . 'Course' . DIRECTORY_SEPARATOR . $row['id'];
                    if (!file_exists($mediadir)) {
                        mkdir($mediadir, 0777, true);
                    }
                    $save_path = dirname(dirname(dirname(dirname(__FILE__)))) . DIRECTORY_SEPARATOR . 'media' . DIRECTORY_SEPARATOR . 'Course' . DIRECTORY_SEPARATOR . $row['id'] . DIRECTORY_SEPARATOR;
                    $row['course_image'] = removeSpaceInName($row['course_image']);
                    copy($temp_path . $row['course_image'], $save_path . $row['course_image']);
                    $hash = md5(ACE_SECRET_KEY . 'Course' . $row['id'] . 'jpg' . SITE_NAME);
                    $image_hash = $row['id'] . '.' . $hash . '.jpg';
                    $data = array(
                        $row['course_image'],
                        $image_hash,
                        $row['id']
                    );
                    pg_execute_query("UPDATE courses SET (course_image, image_hash) = ($1, $2) WHERE id = $3", $data);
                    @unlink($temp_path . $row['course_image']);
                }
            }
            if ($r_resource_cmd == '/subscriptions') {
                if ($authUser['providertype'] == 'admin') {
                    if (!empty($instruction_levels)) {
                        foreach ($instruction_levels as $instruction_level) {
                            $instruction_level_post['subscription_id'] = $row['id'];
                            $instruction_level_post['instructional_level_id'] = $instruction_level;
                            pg_execute_insert('instructional_levels_subscriptions', $instruction_level_post);
                        }
                    }
                }
            }
            if ($r_resource_cmd == '/online_course_lessons') { // To move the Online course lessons files from temp folder to Particular online course lessons folder
                if (!empty($r_post['filename'])) {
                    $origin_path = 'OnlineCourseLesson';
                    if ($row['online_lesson_type_id'] == ConstOnlineLessonTypes::Video) {
                        $origin_path = 'OnlineCourseLessonOrigin';
                    }
                    $temp_path = dirname(dirname(dirname(dirname(__FILE__)))) . DIRECTORY_SEPARATOR . 'media' . DIRECTORY_SEPARATOR . 'temp' . DIRECTORY_SEPARATOR . $authUser['id'] . DIRECTORY_SEPARATOR;
                    $mediadir = dirname(dirname(dirname(dirname(__FILE__)))) . DIRECTORY_SEPARATOR . 'media' . DIRECTORY_SEPARATOR . $origin_path . DIRECTORY_SEPARATOR . $row['id'];
                    if (!file_exists($mediadir)) {
                        mkdir($mediadir, 0777, true);
                    }
                    $save_path = dirname(dirname(dirname(dirname(__FILE__)))) . DIRECTORY_SEPARATOR . 'media' . DIRECTORY_SEPARATOR . $origin_path . DIRECTORY_SEPARATOR . $row['id'] . DIRECTORY_SEPARATOR;
                    $row['filename'] = removeSpaceInName($row['filename']);
                    copy($temp_path . $row['filename'], $save_path . $row['filename']);
                    $data = array(
                        $row['filename'],
                        $row['id']
                    );
                    pg_execute_query("UPDATE online_course_lessons SET (filename) = ($1) WHERE id = $2", $data);
                    if ($row['online_lesson_type_id'] == ConstOnlineLessonTypes::Video) {
                        $data = array(
                            $row['id']
                        );
                        pg_execute_query("UPDATE online_course_lessons SET is_video_converting_is_processing = 1, is_lesson_ready_to_view = 0 WHERE id = $1", $data);
                    }
                    @unlink($temp_path . $row['filename']);
                }
            }
            if ($r_resource_cmd == '/user_cash_withdrawals') {
                $setting_data = pg_query_cache("SELECT * FROM settings WHERE name IN ('site.contact_email','site.currency_symbol','site.currency_code')", array());
                $email_settings_data = array();
                if (!empty($setting_data)) {
                    foreach ($setting_data as $value) {
                        if ($value['name'] == 'site.contact_email') {
                            $email_settings_data['contact_email'] = $value['value'];
                        }
                        if ($value['name'] == 'site.currency_symbol') {
                            $email_settings_data['currency_symbol'] = $value['value'];
                        }
                        if ($value['name'] == 'site.currency_code') {
                            $email_settings_data['currency_code'] = $value['value'];
                        }
                    }
                }
                $emailFindReplace['to'] = $email_settings_data['contact_email'];
                $emailFindReplace['mail'] = 'New Withdrawal Request';
                $emailFindReplace['from'] = $authUser['email'];
                $emailFindReplace['##USERNAME##'] = $authUser['displayname'];
                if (!empty($email_settings_data['currency_symbol'])) {
                    $emailFindReplace['##CURRENCY##'] = $email_settings_data['currency_symbol'];
                }
                if (empty($email_settings_data['currency_symbol'])) {
                    $emailFindReplace['##CURRENCY##'] = $email_settings_data['currency_code'];
                }
                $emailFindReplace['##AMOUNT##'] = $r_post['amount'];
                r_mail($emailFindReplace);
            }
            if ($r_resource_cmd == '/course_users') {
                if (!empty($enabledPlugins[0]['value']) && strpos($enabledPlugins[0]['value'], 'Instructor')) {
                    _mailToInstrutorForNewBooking($response['id']);
                }
            }
        }
    }
    if (!empty($response)) {
        echo json_encode($response);
    } else {
        echo '{}';
    }
}
/**
 * Common method to handle all PUT request
 *
 * @param string $r_resource_cmd     URL
 * @param array  $r_resource_vars    Array generated from URL
 * @param array  $r_resource_filters Array generated from URL query string
 * @param array  $r_put              Put data
 *
 * @return mixed
 */
function r_put($r_resource_cmd, $r_resource_vars, $r_resource_filters, $r_put)
{
    global $r_debug, $authUser, $thumbsizes, $_server_domain_url;
    $emailFindReplace = $response = array();
    $res_status = true;
    $sql = $json = false;
    $table_name = '';
    $id = '';
    switch ($r_resource_cmd) {
    case '/settings/?': // To update settings details based on Id
        $data = array(
            $r_put['id'],
            $r_put['value'],
        );
        pg_execute_query("UPDATE settings SET (value) = ($2) WHERE id = $1", $data);
        break;

    case '/cities/?': // To update cities details based on Id
        $r_put['id'] = $r_resource_vars['cities'];
        if (!empty($authUser) && $authUser['providertype'] == 'admin') {
            $data = array(
                date('Y-m-d H:i:s') ,
                $r_put['country_id'],
                $r_put['state_id'],
                $r_put['name'],
                $r_put['is_active'] ? 1 : 0,
                $r_put['id']
            );
            pg_execute_query("UPDATE cities SET (modified,country_id,state_id,name,is_active) = ($1,$2,$3,$4,$5) WHERE id = $6", $data);
            break;
        } else {
            $response['error']['code'] = 1;
            $response['error']['message'] = 'Authentication failed';
        }
        break;

    case '/countries/?': // To update countries details based on Id
        $r_put['id'] = $r_resource_vars['countries'];
        if (!empty($authUser) && $authUser['providertype'] == 'admin') {
            $data = array(
                date('Y-m-d H:i:s') ,
                $r_put['name'],
                $r_put['iso2'],
                $r_put['iso3'],
                $r_put['id']
            );
            pg_execute_query("UPDATE countries SET (modified,name,iso2,iso3) = ($1,$2,$3,$4) WHERE id = $5", $data);
            break;
        } else {
            $response['error']['code'] = 1;
            $response['error']['message'] = 'Authentication failed';
        }
        break;

    case '/states/?': // To update states details based on Id
        $r_put['id'] = $r_resource_vars['states'];
        if (!empty($authUser) && $authUser['providertype'] == 'admin') {
            $data = array(
                date('Y-m-d H:i:s') ,
                $r_put['country_id'],
                $r_put['name'],
                $r_put['is_active'] ? 1 : 0,
                $r_put['id']
            );
            pg_execute_query("UPDATE states SET (modified,country_id,name,is_active) = ($1,$2,$3,$4) WHERE id = $5", $data);
            break;
        } else {
            $response['error']['code'] = 1;
            $response['error']['message'] = 'Authentication failed';
        }
        break;

    case '/categories/?': // To update categories details based on Id
        $r_put['id'] = $r_resource_vars['categories'];
        $data = array(
            date('Y-m-d H:i:s') ,
            $r_put['is_active'] ? 1 : 0,
            $r_put['parent_id'],
            $r_put['sub_category_name'],
            $r_put['description'],
            $r_put['id'],
        );
        pg_execute_query("UPDATE categories SET (modified,is_active,parent_id,name,description) = ($1, $2, $3, $4, $5) WHERE id = $6", $data);
        break;

    case '/pages/?': // To udate pages details based on Id
        $r_put['id'] = $r_resource_vars['pages'];
        if (!empty($authUser) && $authUser['providertype'] == 'admin') {
            $data = array(
                date('Y-m-d H:i:s') ,
                $r_put['content'],
                $r_put['title'],
                $r_put['slug'],
                $r_put['id'],
            );
            pg_execute_query("UPDATE pages SET (modified, content, title, slug) = ($1, $2, $3, $4) WHERE id = $5", $data);
            break;
        } else {
            $response['error']['code'] = 1;
            $response['error']['message'] = 'Authentication failed';
        }
        break;

    case '/email_templates/?': // To update email templates details based on Id
        $r_put['id'] = $r_resource_vars['email_templates'];
        if (!empty($authUser) && $authUser['providertype'] == 'admin') {
            $sql = true;
            $table_name = 'email_templates';
            // From ng-admin - multiple assignments to same column \"modified\" - raised so unsetted here
            if (!empty($r_put['modified'])) {
                unset($r_put['modified']);
            }
        } else {
            $response['error']['code'] = 1;
            $response['error']['message'] = 'Authentication failed';
        }
        break;

    case '/users/activation': // To activate the user request from Email activation URL
        $user = r_query("SELECT * FROM users WHERE id = $1 AND isemailverified = 0 ", array(
            $r_put['id']
        ));
        if ($user && (md5($user['displayname']) == $r_put['hash'])) {
            pg_execute_query("UPDATE users SET modified = $2, isemailverified = 1 WHERE id = $1", array(
                $r_put['id'],
                date('Y-m-d H:i:s') ,
            ));
            $emailFindReplace = array(
                'mail' => 'Welcome Mail',
                '##CONTACT_URL##' => getSiteUri() . '/app/#!/contactus',
                '##USERNAME##' => $user['displayname'],
                'to' => $user['email']
            );
            $response = r_mail($emailFindReplace);
        } else {
            $response['error'] = array(
                'code' => 1,
                'message' => 'Invalid request'
            );
            $res_status = false;
        }
        break;

    case '/setting_categories/?/settings': // To update settings detail s based on Settings categories Id
        foreach ($r_put As $key => $setting) {
            $data = array(
                $setting,
                $key,
                date('Y-m-d H:i:s') ,
            );
            pg_execute_query("UPDATE settings SET (modified, value) = ($3, $1) WHERE id = $2", $data);
        }
        break;

    case '/courses/?': // To update courses details based on Id
        $table_name = 'courses';
        $r_put['id'] = $r_resource_vars['courses'];
        if (!empty($authUser)) {
            $allowToUpdate = 1;
            if (!empty($r_put['displayname'])) { // assuming, PUT from admin end
                $putRequestFormAdmin = 1;
            }
            if ($authUser['providertype'] != 'admin' && !empty($r_put['course_status_id']) && $r_put['course_status_id'] == ConstCourseStatuses::Active) {
                $courseAutoApprovalSettingCondition = array(
                    'course.is_auto_approval_enabled'
                );
                $courseAutoApprovalSettings = r_query("SELECT value FROM settings WHERE name = $1 order by display_order", $courseAutoApprovalSettingCondition);
                if (empty($courseAutoApprovalSettings) || empty($courseAutoApprovalSettings['value'])) {
                    $allowToUpdate = 0;
                }
            }
            $conditions = array(
                $r_resource_vars['courses']
            );
            $course_data = r_query("SELECT id, user_id FROM courses WHERE id = $1", $conditions);
            if (($authUser['id'] === $course_data['user_id'] || $authUser['providertype'] == 'admin') && $allowToUpdate) {
                $field = "id,user_id,title,subtitle,parent_category_id,category_id,description,price,students_will_be_able_to,who_should_take_this_course_and_who_should_not,what_actions_students_have_to_perform_before_begin,instructional_level_id,language_id,course_image,image_hash,course_status_id,meta_keywords,meta_description,promo_video,is_featured";
                $fields = explode(",", $field);
                $put_values = $r_put;
                $r_put = array();
                foreach ($put_values as $key => $value) {
                    if (in_array(trim($key) , $fields)) {
                        $r_put[$key] = $value;
                        if ($key === 'title') {
                            require_once APP_PATH . DIRECTORY_SEPARATOR . 'server' . DIRECTORY_SEPARATOR . 'php' . DIRECTORY_SEPARATOR . 'libs' . DIRECTORY_SEPARATOR . 'Inflector.php';
                            $inflector = new Inflector();
                            $r_put['slug'] = $inflector->slug($value, '-');
                        }
                    }
                }
                $sql = true;
            } else {
                $response['error']['code'] = 1;
                $response['error']['message'] = 'Authentication failed';
            }
        } else {
            $response['error']['code'] = 1;
            $response['error']['message'] = 'Authentication failed';
        }
        break;

    case '/instructional_levels/?': // To update instructional levels details based on Id
        $table_name = 'instructional_levels';
        $r_put['id'] = $r_resource_vars['instructional_levels'];
        // From ng-admin - multiple assignments to same column \"modified\" - raised so unsetted here
        if (!empty($r_put['modified'])) {
            unset($r_put['modified']);
        }
        if ($authUser['providertype'] == 'admin') {
            $sql = true;
        } else {
            $response['error']['code'] = 1;
            $response['error']['message'] = 'Authentication failed';
        }
        break;

    case '/languages/?': // To update languages details based on Id
        $table_name = 'languages';
        $r_put['id'] = $r_resource_vars['languages'];
        // From ng-admin - multiple assignments to same column \"modified\" - raised so unsetted here
        if (!empty($r_put['modified'])) {
            unset($r_put['modified']);
        }
        if ($authUser['providertype'] == 'admin') {
            $data = array(
                date('Y-m-d H:i:s') ,
                $r_put['name'],
                $r_put['iso2'],
                $r_put['iso3'],
                $r_put['is_active'] ? 1 : 0,
                $r_put['id']
            );
            pg_execute_query("UPDATE languages SET (modified,name,iso2,iso3,is_active) = ($1, $2, $3, $4, $5) WHERE id = $6", $data);
            break;
        } else {
            $response['error']['code'] = 1;
            $response['error']['message'] = 'Authentication failed';
        }
        break;

    case '/online_course_lessons/?': // To update online course lessons details based on Id
        $table_name = 'online_course_lessons';
        $r_put['id'] = $r_resource_vars['online_course_lessons'];
        if (!empty($r_put['online_lesson_type_id']) && $r_put['online_lesson_type_id'] == ConstOnlineLessonTypes::VideoExternal && !empty($r_put['embed_code'])) {
            require_once APP_PATH . DIRECTORY_SEPARATOR . 'server' . DIRECTORY_SEPARATOR . 'php' . DIRECTORY_SEPARATOR . 'plugins' . DIRECTORY_SEPARATOR . 'VideoExternalEmbedLessons' . DIRECTORY_SEPARATOR . 'functions.php';
            $checkIsEmbedValid = getVideoEmbedCode($r_put['embed_code']);
            if ($checkIsEmbedValid === 0) {
                $sql = false;
                $response['error']['code'] = 2;
                $response['error']['message'] = 'Site couldn\'t process your video URL. Please enter valid URL or some other URL.';
            } else {
                $r_put['embed_code'] = $checkIsEmbedValid;
            }
        }
        $sql = true;
        break;

    case '/online_course_lessons/courses/?/update_display_order': // To update online course lessons details based on Id
        $r_put['course_id'] = $r_resource_vars['courses'];
        $conditions = array(
            $r_put['course_id'],
            $authUser['id']
        );
        $course = r_query("SELECT id FROM courses WHERE id = $1 and user_id = $2", $conditions);
        if ($authUser['providertype'] == 'admin' || $course) { // checking owner and admin rights to update this
            if (!empty($r_put['online_course_lessons'])) {
                $online_course_lessons = explode(',', $r_put['online_course_lessons']);
                $i = 1;
                foreach ($online_course_lessons as $key => $lesson_id) {
                    $r_put = array();
                    $r_put[] = $i;
                    $r_put[] = $r_resource_vars['courses'];
                    $r_put[] = trim($lesson_id);
                    $r_put[] = date('Y-m-d H:i:s');
                    $i++;
                    pg_execute_query("UPDATE online_course_lessons SET (modified, display_order) = ($4, $1) WHERE course_id = $2 AND id = $3", $r_put);
                }
            }
        } else {
            $response['error']['code'] = 1;
            $response['error']['message'] = 'Authentication failed';
        }
        $sql = false;
        break;

    case '/online_course_lesson_views/?': // To update online_course_lesson_views details based on Id
        $r_put['online_course_lesson_id'] = $r_resource_vars['online_course_lesson_views'];
        if (!empty($authUser)) {
            $conditions = array(
                $authUser['id'],
                $r_put['online_course_lesson_id'],
            );
            $course_user = r_query("SELECT id, course_user_status_id FROM course_users WHERE user_id = $1 and course_id = (select course_id from online_course_lessons where id = $2) ", $conditions);
            if (!empty($course_user)) {
                $conditions = array(
                    $authUser['id'],
                    $r_put['online_course_lesson_id']
                );
                $online_course_lesson_view = r_query("SELECT is_completed FROM online_course_lesson_views WHERE user_id = $1 and online_course_lesson_id = $2 ", $conditions);
                if ($online_course_lesson_view['is_completed'] == 0) {
                    $data = array(
                        1,
                        $r_put['online_course_lesson_id'],
                        date('Y-m-d H:i:s') ,
                    );
                    pg_execute_query("UPDATE online_course_lesson_views SET (modified, is_completed) = ($3, $1) WHERE online_course_lesson_id = $2", $data);
                } else if ($online_course_lesson_view['is_completed'] == 1) {
                    $data = array(
                        0,
                        $r_put['online_course_lesson_id'],
                        date('Y-m-d H:i:s') ,
                    );
                    pg_execute_query("UPDATE online_course_lesson_views SET (modified,is_completed) = ($3, $1) WHERE online_course_lesson_id = $2", $data);
                }
                $conditions = array(
                    $r_put['online_course_lesson_id']
                );
                $course = r_query("SELECT course_id FROM online_course_lesson_views WHERE online_course_lesson_id = $1 ", $conditions);
                if (!empty($course)) {
                    $conditions = array(
                        $course['course_id'],
                        $authUser['id'],
                    );
                    $completed = r_query("select (select count(id) from online_course_lessons where is_active = 't' AND is_chapter = 0 AND course_id = $1) as total_lesson_count, (select count(id) from online_course_lesson_views where is_completed = 1 AND course_id = $1 AND user_id = $2) as total_completed_count", $conditions);
                    if (!empty($completed)) {
                        if ($completed['total_lesson_count'] == $completed['total_completed_count']) {
                            $data = array(
                                ConstCourseUserStatuses::Completed,
                                $course['course_id'],
                                $authUser['id'],
                                ConstCourseUserStatuses::InProgress,
                                date('Y-m-d H:i:s') ,
                            );
                            pg_execute_query("UPDATE course_users SET (modified, course_user_status_id) = ($5, $1) WHERE course_id = $2 and user_id = $3 and course_user_status_id = $4", $data);
                        } else {
                            if ($course_user['course_user_status_id'] == ConstCourseUserStatuses::NotStarted) {
                                $data = array(
                                    $course['course_id'],
                                    $authUser['id'],
                                    ConstCourseUserStatuses::InProgress,
                                    date('Y-m-d H:i:s') ,
                                );
                                pg_execute_query("UPDATE course_users SET (modified,course_user_status_id) = ($4, $3) WHERE course_id = $1 AND user_id = $2", $data);
                            } else {
                                $data = array(
                                    ConstCourseUserStatuses::InProgress,
                                    $course['course_id'],
                                    $authUser['id'],
                                    ConstCourseUserStatuses::Completed,
                                    date('Y-m-d H:i:s') ,
                                );
                                pg_execute_query("UPDATE course_users SET (modified, course_user_status_id) = ($5, $1) WHERE course_id = $2 AND user_id = $3 AND course_user_status_id = $4", $data);
                            }
                        }
                    }
                }
            } else {
                $response['error']['code'] = 1;
                $response['error']['message'] = 'Authentication failed';
            }
        } else {
            $response['error']['code'] = 1;
            $response['error']['message'] = 'Authentication failed';
        }
        break;

    case '/users/?': // To update user details based on Id
        $table_name = 'users';
        $r_put['id'] = $r_resource_vars['users'];
        $data[] = $r_put['id'];
        $user_fields = 'id,';
        $user_values = '$1,';
        if (!empty($authUser) && $authUser['providertype'] == 'admin') {
            if ($authUser['providertype'] == 'admin') {
                if (!empty($r_put['providertype'])) {
                    $data[] = $r_put['providertype'];
                    $user_fields.= 'providertype,';
                    $user_values.= '$2,';
                }
                if (!empty($r_put['email'])) {
                    $data[] = $r_put['email'];
                    $user_fields.= 'email,';
                    $user_values.= '$3,';
                }
                if (isset($r_put['is_active'])) {
                    $data[] = $r_put['is_active'] ? 't' : 'f';
                    $user_fields.= 'is_active,';
                    $user_values.= '$4,';
                }
                if (isset($r_put['isemailverified'])) {
                    $data[] = $r_put['isemailverified'];
                    $user_fields.= 'isemailverified,';
                    $user_values.= '$5,';
                }
                if (isset($r_put['isemailverified'])) {
                    $data[] = $r_put['is_teacher'];
                    $user_fields.= 'is_teacher,';
                    $user_values.= '$6,';
                }
                if (isset($r_put['available_balance'])) {
                    $data[] = $r_put['available_balance'];
                    $user_fields.= 'available_balance,';
                    $user_values.= '$7,';
                }
            }
            if (isset($r_put['displayname'])) {
                $data[] = $r_put['displayname'];
                $user_fields.= 'displayname,';
                $user_values.= '$8,';
            }
            $data[] = date('Y-m-d H:i:s');
            $user_fields.= 'modified,';
            $user_values.= '$9,';
            if (isset($r_put['password'])) {
                $data[] = getCryptHash($r_put['password']);
                $user_fields.= 'password,';
                $user_values.= '$10,';
            }
            $user_fields = trim($user_fields, ",");
            $user_values = trim($user_values, ",");
            $user = r_query('SELECT displayname, email, is_active FROM users WHERE id = $1', array(
                $r_put['id'],
            ));
            pg_execute_query("UPDATE users SET ($user_fields) = ($user_values) WHERE id = $1", $data);
            $emailFindReplace['mail'] = (!empty($r_put['is_active']) && $r_put['is_active'] == 1) ? 'Admin User Active' : 'Admin User Deactivate';
            $emailFindReplace['##USERNAME##'] = $user['displayname'];
            $emailFindReplace['to'] = $user['email'];
            if ($r_put['is_active'] != 1 && $user['is_active'] == 't') {
                r_mail($emailFindReplace);
            }
            if ($r_put['is_active'] != 0 && $user['is_active'] == 'f') {
                r_mail($emailFindReplace);
            }
            if (!empty($r_put['password'])) {
                $emailFindReplace['mail'] = 'Admin Change Password';
                $emailFindReplace['##USERNAME##'] = $user['displayname'];
                $emailFindReplace['##PASSWORD##'] = $r_put['password'];
                $emailFindReplace['to'] = $user['email'];
                r_mail($emailFindReplace);
            }
        } else {
            $response['error']['code'] = 1;
            $response['error']['message'] = 'Authentication failed';
        }
        break;

    case '/users/edit-profile': // To update user details from User end Profile page
        $table_name = 'users';
        $r_put['id'] = $authUser['id'];
        $field = "id,designation,displayname,username,headline,biography,user_image,website,facebook_profile_link,twitter_profile_link,google_plus_profile_link,linkedin_profile_link,youtube_profile_link,meta_keywords,meta_description";
        $fields = explode(",", $field);
        $put_values = $r_put;
        $r_put = array();
        foreach ($put_values as $key => $value) {
            if (in_array(trim($key) , $fields)) {
                $r_put[$key] = $value;
            }
        }
        $sql = true;
        break;

    case '/users/?/courses': // To update courses details based on User Id
        $table_name = 'courses';
        $sql = true;
        break;

    case '/users/?/active': //To update users activation/deactivation based on User Id
        $table_name = 'users';
        $sql = true;
        break;

    case '/user_notifications/?': // To update user notification details based on Id
        $table_name = 'user_notifications';
        $sql = true;
        break;

    case '/settings/plugins': // To update plugin enable and disable
        $setting_plugin = r_query("SELECT value FROM settings WHERE name ='site.enabled_plugins'");
        $pluginArray = explode(",", $setting_plugin['value']);
        $pluginArray = array_map('trim', $pluginArray);
        $disable_plugin = array(
            'Withdrawal',
            'Coupons',
            'Payout'
        );
        if ($authUser['providertype'] == 'admin') { // checking admin rights to enable or diable plugins
            //to enable plugin
            if ($r_put['is_enabled'] === 1) {
                if (!in_array($r_put['plugin_name'], $pluginArray)) {
                    $pluginArray[] = $r_put['plugin_name'];
                }
                $pluginStr = implode(',', $pluginArray);
                $data = array(
                    $pluginStr,
                );
                pg_execute_query("UPDATE settings SET value = $1 WHERE name = 'site.enabled_plugins'", $data);
            } else if ($r_put['is_enabled'] === 0) { //to disable plugin
                $key = array_search($r_put['plugin_name'], $pluginArray);
                if ($key !== false) {
                    unset($pluginArray[$key]);
                }
                if ($r_put['plugin_name'] == 'CourseCheckout') {
                    foreach ($disable_plugin as $key_value) {
                        $key = array_search($key_value, $pluginArray);
                        if (!empty($key)) {
                            unset($pluginArray[$key]);
                        }
                    }
                }
                $pluginStr = implode(',', $pluginArray);
                $data = array(
                    $pluginStr,
                );
                pg_execute_query("UPDATE settings SET value = $1 WHERE name = 'site.enabled_plugins'", $data);
            }
        } else {
            $response['error']['code'] = 1;
            $response['error']['message'] = 'Authentication failed';
        }
        break;

    default:
        $pluginConditions = array(
            'site.enabled_plugins'
        );
        $enabledPlugins = pg_query_cache("SELECT value FROM settings WHERE name = $1 order by display_order", $pluginConditions);
        $plugin_url = array();
        if (!empty($enabledPlugins[0]['value']) && strpos($enabledPlugins[0]['value'], 'Coupons') !== false) {
            $plugin_url['Coupons'] = array(
                '/coupons/?'
            );
        }
        if (!empty($enabledPlugins[0]['value']) && strpos($enabledPlugins[0]['value'], 'Withdrawal') !== false) {
            $plugin_url['Withdrawal'] = array(
                '/user_cash_withdrawals/?'
            );
        }
        if (!empty($enabledPlugins[0]['value']) && strpos($enabledPlugins[0]['value'], 'RatingAndReview') !== false) {
            $plugin_url['RatingAndReview'] = array(
                '/course_user_feedbacks/?'
            );
        }
        if (!empty($enabledPlugins[0]['value']) && strpos($enabledPlugins[0]['value'], 'SocialLogins') !== false) {
            $plugin_url['SocialLogins'] = array(
                '/providers/?'
            );
        }
        if (!empty($enabledPlugins[0]['value']) && strpos($enabledPlugins[0]['value'], 'Subscriptions') !== false) {
            $plugin_url['Subscriptions'] = array(
                '/subscriptions/?',
                '/user_subscription_logs/?',
                '/user_subscriptions/?'
            );
        }
        foreach ($plugin_url as $plugin_key => $plugin_values) {
            if (in_array($r_resource_cmd, $plugin_values)) {
                $pluginToBePassed = $plugin_key;
                break;
            }
        }
        if (!empty($pluginToBePassed)) {
            require_once APP_PATH . DIRECTORY_SEPARATOR . 'server' . DIRECTORY_SEPARATOR . 'php' . DIRECTORY_SEPARATOR . 'plugins' . DIRECTORY_SEPARATOR . $pluginToBePassed . DIRECTORY_SEPARATOR . 'R' . DIRECTORY_SEPARATOR . 'r.php';
            $passed_values = array();
            $passed_values['sql'] = $sql;
            $passed_values['table_name'] = $table_name;
            $passed_values['r_resource_cmd'] = $r_resource_cmd;
            $passed_values['r_resource_vars'] = $r_resource_vars;
            $passed_values['r_resource_filters'] = $r_resource_filters;
            $passed_values['authUser'] = $authUser;
            $passed_values['r_put'] = $r_put;
            $plugin_return = call_user_func($plugin_key . '_r_put', $passed_values);
            foreach ($plugin_return as $return_plugin_key => $return_plugin_values) {
                $ {
                    $return_plugin_key
                } = $return_plugin_values;
            }
        }
    }
    if (!empty($sql)) {
        $result = pg_execute_update($table_name, $r_put);
        if ($r_resource_cmd == '/provider_networks/?') {
            updateProviderInfo($r_resource_vars['provider_networks']);
        }
        if ($r_resource_cmd == '/online_course_lessons/?') {
            if (!empty($r_put['filename'])) {
                $origin_path = 'OnlineCourseLesson';
                if ($r_put['online_lesson_type_id'] == ConstOnlineLessonTypes::Video) {
                    $origin_path = 'OnlineCourseLessonOrigin';
                }
                $temp_path = dirname(dirname(dirname(dirname(__FILE__)))) . DIRECTORY_SEPARATOR . 'media' . DIRECTORY_SEPARATOR . 'temp' . DIRECTORY_SEPARATOR . $authUser['id'] . DIRECTORY_SEPARATOR;
                $mediadir = dirname(dirname(dirname(dirname(__FILE__)))) . DIRECTORY_SEPARATOR . 'media' . DIRECTORY_SEPARATOR . $origin_path . DIRECTORY_SEPARATOR . $r_put['id'];
                if (!file_exists($mediadir)) {
                    mkdir($mediadir, 0777, true);
                }
                $save_path = dirname(dirname(dirname(dirname(__FILE__)))) . DIRECTORY_SEPARATOR . 'media' . DIRECTORY_SEPARATOR . $origin_path . DIRECTORY_SEPARATOR . $r_put['id'] . DIRECTORY_SEPARATOR;
                $r_put['filename'] = removeSpaceInName($r_put['filename']);
                copy($temp_path . $r_put['filename'], $save_path . $r_put['filename']);
                $data = array(
                    $r_put['filename'],
                    $r_put['id']
                );
                pg_execute_query("UPDATE online_course_lessons SET (filename) = ($1) WHERE id = $2", $data);
                if ($r_put['online_lesson_type_id'] == ConstOnlineLessonTypes::Video) {
                    $data = array(
                        $r_put['id']
                    );
                    pg_execute_query("UPDATE online_course_lessons SET is_video_converting_is_processing = 1, is_lesson_ready_to_view = 0 WHERE id = $1", $data);
                }
                @unlink($temp_path . $r_put['filename']);
            }
        }
        if ($r_resource_cmd == '/courses/?') { // To move course images from temp folder to particular courses folder
            // We get old record in /courses and assigned in $course_data
            if ($authUser['providertype'] == 'admin') {
                $beforeUpdateUserId = !empty($course_data['user_id']) ? $course_data['user_id'] : '';
                $currentUpdateUserId = !empty($r_put['user_id']) ? $r_put['user_id'] : '';
            }
            if ($authUser['providertype'] == 'admin' && $beforeUpdateUserId != $currentUpdateUserId) {
                if (!empty($course_data['user_id'])) {
                    _updateIsTeacher($course_data['user_id']);
                }
                if (!empty($r_put['user_id'])) {
                    _updateIsTeacher($r_put['user_id']);
                }
            }
            if (!empty($r_put['course_image']) && empty($putRequestFormAdmin)) { // empty($putRequestFormAdmin) - is for avoiding this code from  admin end edit form
                $conditions = array(
                    $r_put['id']
                );
                $course_data = r_query("SELECT * FROM courses WHERE id = $1", $conditions);
                if (!empty($course_data)) {
                    $temp_path = dirname(dirname(dirname(dirname(__FILE__)))) . DIRECTORY_SEPARATOR . 'media' . DIRECTORY_SEPARATOR . 'temp' . DIRECTORY_SEPARATOR . 'Course' . DIRECTORY_SEPARATOR . $course_data['id'] . DIRECTORY_SEPARATOR;
                    $course_data['course_image'] = removeSpaceInName($course_data['course_image']);
                    if (file_exists($temp_path . $course_data['course_image'])) {
                        $mediadir = dirname(dirname(dirname(dirname(__FILE__)))) . DIRECTORY_SEPARATOR . 'media' . DIRECTORY_SEPARATOR . 'Course' . DIRECTORY_SEPARATOR . $course_data['id'];
                        if (!file_exists($mediadir)) {
                            mkdir($mediadir, 0777, true);
                        }
                        $save_path = dirname(dirname(dirname(dirname(__FILE__)))) . DIRECTORY_SEPARATOR . 'media' . DIRECTORY_SEPARATOR . 'Course' . DIRECTORY_SEPARATOR . $course_data['id'] . DIRECTORY_SEPARATOR;
                        copy($temp_path . $course_data['course_image'], $save_path . $course_data['course_image']);
                        $hash = md5(ACE_SECRET_KEY . 'Course' . $course_data['id'] . 'jpg' . SITE_NAME);
                        $image_hash = $course_data['id'] . '.' . $hash . '.jpg';
                        $data = array(
                            $course_data['course_image'],
                            $image_hash,
                            $course_data['id']
                        );
                        pg_execute_query("UPDATE courses SET (course_image, image_hash) = ($1, $2) WHERE id = $3", $data);
                        @unlink($temp_path . $course_data['course_image']);
                    }
                }
            }
            if (!empty($r_put['promo_video']) && empty($putRequestFormAdmin)) { // empty($putRequestFormAdmin) - is for avoiding this code from  admin end edit form
                $temp_path = dirname(dirname(dirname(dirname(__FILE__)))) . DIRECTORY_SEPARATOR . 'media' . DIRECTORY_SEPARATOR . 'temp' . DIRECTORY_SEPARATOR . $authUser['id'] . DIRECTORY_SEPARATOR;
                $mediadir = dirname(dirname(dirname(dirname(__FILE__)))) . DIRECTORY_SEPARATOR . 'media' . DIRECTORY_SEPARATOR . 'CoursePromoVideoOrigin' . DIRECTORY_SEPARATOR . $r_put['id'];
                if (!file_exists($mediadir)) {
                    mkdir($mediadir, 0777, true);
                } else {
                    $files = glob($mediadir . DIRECTORY_SEPARATOR . '*'); // get all file names
                    foreach ($files as $file) { // iterate files
                        if (is_file($file)) {
                            unlink($file); // delete file
                            
                        }
                    }
                }
                $save_path = dirname(dirname(dirname(dirname(__FILE__)))) . DIRECTORY_SEPARATOR . 'media' . DIRECTORY_SEPARATOR . 'CoursePromoVideoOrigin' . DIRECTORY_SEPARATOR . $r_put['id'] . DIRECTORY_SEPARATOR;
                $r_put['promo_video'] = removeSpaceInName($r_put['promo_video']);
                copy($temp_path . $r_put['promo_video'], $save_path . $r_put['promo_video']);
                $data = array(
                    $r_put['promo_video'],
                    1,
                    $r_put['id']
                );
                pg_execute_query("UPDATE courses SET (promo_video, is_promo_video_converting_is_processing) = ($1, $2) WHERE id = $3", $data);
                @unlink($temp_path . $r_put['promo_video']);
            }
        }
        // When changing status of user_subscription_logs, need to update parent record (user_subscriptions)
        if ($r_resource_cmd == '/user_subscription_logs/?') {
            if (!empty($r_put['subscription_status_id']) && $r_put['subscription_status_id'] != $original_user_subscription_log[0]['user_subscription_id'] && $r_put['subscription_status_id'] == ConstSubscriptionStatuses::Canceled) {
                $data = array(
                    ConstSubscriptionStatuses::Canceled,
                    $original_user_subscription_log[0]['user_subscription_id'],
                    date('Y-m-d H:i:s')
                );
                $result = pg_execute_query("UPDATE user_subscriptions SET (modified, subscription_status_id, subscription_canceled_date) = ($3, $1, $3) WHERE id = $2", $data);
            } else if (!empty($r_put['subscription_status_id']) && $r_put['subscription_status_id'] != $original_user_subscription_log[0]['user_subscription_id'] && $r_put['subscription_status_id'] != ConstSubscriptionStatuses::Canceled) {
                $data = array(
                    $r_put['subscription_status_id'],
                    $original_user_subscription_log[0]['user_subscription_id'],
                    date('Y-m-d H:i:s')
                );
                $result = pg_execute_query("UPDATE user_subscriptions SET (modified, subscription_status_id, subscription_canceled_date) = ($3, $1, NULL) WHERE id = $2", $data);
            }
        }
        if ($r_resource_cmd == '/subscriptions/?') {
            if ($authUser['providertype'] == 'admin') {
                if (!empty($instruction_levels)) {
                    $conditions = array(
                        $r_put['id']
                    );
                    pg_execute_query("DELETE FROM instructional_levels_subscriptions WHERE subscription_id = $1", $conditions);
                    foreach ($instruction_levels as $instruction_level) {
                        $instruction_level_post['subscription_id'] = $r_put['id'];
                        $instruction_level_post['instructional_level_id'] = $instruction_level;
                        pg_execute_insert('instructional_levels_subscriptions', $instruction_level_post);
                    }
                }
            }
        }
        if ($r_resource_cmd == '/user_cash_withdrawals/?') {
            if ($authUser['providertype'] == 'admin') {
                if (!empty($user_cash_withdrawals)) {
                    $conditions = array(
                        $r_put['id']
                    );
                    $approved_data = r_query("select ucw.user_id, ucw.amount, u.displayname, u.email, u.available_balance, ucw.withdrawal_status_id FROM user_cash_withdrawals ucw inner join users u on u.id = ucw.user_id WHERE ucw.id = $1", $conditions);
                    $setting_data = pg_query_cache("SELECT * FROM settings WHERE name IN('site.currency_symbol','site.currency_code')", array());
                    $email_settings_data = array();
                    if (!empty($setting_data)) {
                        foreach ($setting_data as $value) {
                            if ($value['name'] == 'site.currency_symbol') {
                                $email_settings_data['currency_symbol'] = $value['value'];
                            }
                            if ($value['name'] == 'site.currency_code') {
                                $email_settings_data['currency_code'] = $value['value'];
                            }
                        }
                    }
                    if (!empty($approved_data)) {
                        if ($approved_data['withdrawal_status_id'] == ConstWithdrawalStatuses::AmountTransferred) {
                            $user_put['id'] = $approved_data['user_id'];
                            $user_put['available_balance'] = ($approved_data['available_balance'] - $approved_data['amount']);
                            pg_execute_update('users', $user_put);
                            $emailFindReplace['mail'] = 'Withdrawal Request Approved';
                            $emailFindReplace['##USERNAME##'] = $approved_data['displayname'];
                            if (!empty($email_settings_data['currency_symbol'])) {
                                $emailFindReplace['##CURRENCY##'] = $email_settings_data['currency_symbol'];
                            }
                            if (empty($email_settings_data['currency_symbol'])) {
                                $emailFindReplace['##CURRENCY##'] = $email_settings_data['currency_code'];
                            }
                            $emailFindReplace['##AMOUNT##'] = $approved_data['amount'];
                            $emailFindReplace['##CURRENT_BALANCE##'] = $user_put['available_balance'];
                            $emailFindReplace['to'] = $approved_data['email'];
                            r_mail($emailFindReplace);
                        } else if ($approved_data['withdrawal_status_id'] == ConstWithdrawalStatuses::Rejected) {
                            $emailFindReplace['mail'] = 'Withdrawal Request Rejected';
                            $emailFindReplace['##USERNAME##'] = $approved_data['displayname'];
                            $emailFindReplace['to'] = $approved_data['email'];
                            if (!empty($email_settings_data['currency_symbol'])) {
                                $emailFindReplace['##CURRENCY##'] = $email_settings_data['currency_symbol'];
                            }
                            if (empty($email_settings_data['currency_symbol'])) {
                                $emailFindReplace['##CURRENCY##'] = $email_settings_data['currency_code'];
                            }
                            $emailFindReplace['##AMOUNT##'] = $approved_data['amount'];
                            $emailFindReplace['##CURRENT_BALANCE##'] = $approved_data['available_balance'];
                            r_mail($emailFindReplace);
                        } else if ($user_cash_withdrawals['withdrawal_status_id'] == ConstWithdrawalStatuses::AmountTransferred && ($approved_data['withdrawal_status_id'] != $user_cash_withdrawals['withdrawal_status_id'])) {
                            $user_put['id'] = $approved_data['user_id'];
                            $user_put['available_balance'] = ($approved_data['available_balance'] + $approved_data['amount']);
                            pg_execute_update('users', $user_put);
                        }
                    }
                }
            }
        }
        if ($r_resource_cmd == '/users/?' || $r_resource_cmd == '/users/edit-profile') { // To move User images from temp folder to particular user folder
            if (!empty($r_put['user_image'])) {
                $conditions = array(
                    $r_put['id']
                );
                $user_data = r_query("SELECT * FROM users WHERE id = $1", $conditions);
                if (!empty($user_data)) {
                    $temp_path = dirname(dirname(dirname(dirname(__FILE__)))) . DIRECTORY_SEPARATOR . 'media' . DIRECTORY_SEPARATOR . 'temp' . DIRECTORY_SEPARATOR . $authUser['id'] . DIRECTORY_SEPARATOR;
                    $mediadir = dirname(dirname(dirname(dirname(__FILE__)))) . DIRECTORY_SEPARATOR . 'media' . DIRECTORY_SEPARATOR . 'User' . DIRECTORY_SEPARATOR . $user_data['id'];
                    if (!file_exists($mediadir)) {
                        mkdir($mediadir, 0777, true);
                    }
                    $save_path = dirname(dirname(dirname(dirname(__FILE__)))) . DIRECTORY_SEPARATOR . 'media' . DIRECTORY_SEPARATOR . 'User' . DIRECTORY_SEPARATOR . $user_data['id'] . DIRECTORY_SEPARATOR;
                    $user_data['user_image'] = removeSpaceInName($user_data['user_image']);
                    copy($temp_path . $user_data['user_image'], $save_path . $user_data['user_image']);
                    $hash = md5(ACE_SECRET_KEY . 'User' . $user_data['id'] . 'jpg' . SITE_NAME);
                    $image_hash = $user_data['id'] . '.' . $hash . '.jpg';
                    $data = array(
                        $user_data['user_image'],
                        $image_hash,
                        $user_data['id']
                    );
                    pg_execute_query("UPDATE users SET (user_image, image_hash) = ($1, $2) WHERE id = $3", $data);
                    @unlink($temp_path . $user_data['user_image']);
                    $response['data'] = array(
                        'image_hash' => $image_hash
                    );
                    $response['error'] = array(
                        'code' => isset($result['error']) ? 1 : 0,
                        'reason' => isset($result['error']) ? $result['error'] : '',
                        'message' => isset($result['error']) ? $result['error'] : 'Success'
                    );
                }
            }
        }
    }
    if (empty($response)) {
        $response['error'] = array(
            'code' => isset($result['error']) ? 1 : 0,
            'reason' => isset($result['error']) ? $result['error'] : '',
            'message' => isset($result['error']) ? '' : 'Success'
        );
    }
    echo json_encode($response);
}
/**
 * Common method to handle all DELETE request
 *
 * @param string $r_resource_cmd     URL
 * @param array  $r_resource_vars    Array generated from URL
 * @param array  $r_resource_filters Array generated from URL query string
 *
 * @return mixed
 */
function r_delete($r_resource_cmd, $r_resource_vars, $r_resource_filters)
{
    global $r_debug, $authUser;
    $sql = false;
    $response = array();
    $val_arr = array();
    $bulk_delete = 0;
    switch ($r_resource_cmd) {
    case '/users/?': // To delete users details based on Id
        if (!empty($authUser) && $authUser['providertype'] == 'admin') {
            $val_arr[] = $r_resource_vars['users'];
            $sql = "DELETE FROM users WHERE id = $1";
            $user_detail = r_query("select email, displayname from users where id = $1", $val_arr);
        } else {
            $result['error'] = "Authentication failed";
        }
        break;

    case '/cities/?': // To delete cities details  based on Id
        if (!empty($authUser) && $authUser['providertype'] == 'admin') {
            $val_arr[] = $r_resource_vars['cities'];
            $sql = "DELETE FROM cities WHERE id = $1";
        } else {
            $response['error']['code'] = 1;
            $response['error']['message'] = 'Authentication failed';
        }
        break;

    case '/contacts/?': // To delete contacts details based on Id
        $val_arr[] = $r_resource_vars['contacts'];
        $sql = "DELETE FROM contacts WHERE id = $1";
        break;

    case '/countries/?': // To delete countries details based on Id
        if (!empty($authUser) && $authUser['providertype'] == 'admin') {
            $val_arr[] = $r_resource_vars['countries'];
            $sql = "DELETE FROM countries WHERE id = $1";
        } else {
            $response['error']['code'] = 1;
            $response['error']['message'] = 'Authentication failed';
        }
        break;

    case '/states/?': // To delete states details based on Id
        $val_arr[] = $r_resource_vars['states'];
        if (!empty($authUser) && $authUser['providertype'] == 'admin') {
            $sql = "DELETE FROM states WHERE id = $1";
        } else {
            $response['error']['code'] = 1;
            $response['error']['message'] = 'Authentication failed';
        }
        break;

    case '/categories/?': // To delete categories details based on Id
        if ($authUser['providertype'] == 'admin') {
            $val_arr[] = $r_resource_vars['categories'];
            $sql = "DELETE FROM categories WHERE id = $1";
        } else {
            $result['error'] = "Authentication failed";
        }
        break;

    case '/ips/?': // To delete ips details based on Id
        $val_arr[] = $r_resource_vars['ips'];
        $sql = "DELETE FROM ips WHERE id = $1";
        break;

    case '/pages/?': // To delete pages details based on Id
        if (!empty($authUser) && $authUser['providertype'] == 'admin') {
            $val_arr[] = $r_resource_vars['pages'];
            $sql = "DELETE FROM pages WHERE id = $1";
        } else {
            $result['error'] = "Authentication failed";
        }
        break;

    case '/user_logins/?': // To delete user logins details based on Id
        if (!empty($authUser) && $authUser['providertype'] == 'admin') {
            $val_arr[] = $r_resource_vars['user_logins'];
            $sql = "DELETE FROM user_logins WHERE id = $1";
        } else {
            $result['error'] = "Authentication failed";
        }
        break;

    case '/course_users/?': // To delete course users details based on Id
        $val_arr[] = $r_resource_vars['course_users'];
        if ($authUser['providertype'] == 'admin') {
            $conditions = array(
                $r_resource_vars['course_users']
            );
            $courseUserData = r_query('SELECT cu.course_id, c.user_id as teacher_user_id, cu.user_id, cu.coupon_id, (cu.price - cu.site_commission_amount) as amount, course_user_status_id FROM course_users cu JOIN courses c on cu.course_id = c.id WHERE cu.id = $1', $conditions);
            $sql = "DELETE FROM course_users WHERE id = $1";
        } else {
            $result['error'] = "Authentication failed";
        }
        break;

    case '/courses/?': // To delete course details based on Id
        $val_arr[] = $r_resource_vars['courses'];
        $conditions = array(
            $r_resource_vars['courses']
        );
        $course_data = r_query("SELECT user_id FROM courses WHERE id = $1", $conditions);
        if ($authUser['providertype'] == "admin") {
            $sql = "DELETE FROM courses WHERE id = $1";
        } else {
            $result['error'] = "Authentication failed";
        }
        break;

    case '/instructional_levels/?': // To delete instructional levels details based on Id
        $val_arr[] = $r_resource_vars['instructional_levels'];
        if ($authUser['providertype'] == 'admin') {
            $sql = "DELETE FROM instructional_levels WHERE id = $1";
        } else {
            $result['error'] = "Authentication failed";
        }
        break;

    case '/languages/?': // To delete languages details based on Id
        $val_arr[] = $r_resource_vars['languages'];
        if ($authUser['providertype'] == 'admin') {
            $sql = "DELETE FROM languages WHERE id = $1";
        } else {
            $result['error'] = "Authentication failed";
        }
        break;

    case '/online_course_lessons/?': // To delete online course lessons details based on Id
        $val_arr[] = $r_resource_vars['online_course_lessons'];
        $online_courses = r_query("SELECT user_id FROM online_course_lessons WHERE id = $1", $val_arr);
        if ($authUser['providertype'] == 'admin' || $authUser['id'] == $online_courses['user_id']) {
            $sql = "DELETE FROM online_course_lessons WHERE id = $1";
        } else {
            $result['error'] = "Authentication failed";
        }
        break;

    case '/transactions/?': // To delete transactions details based on Id
        $val_arr[] = $r_resource_vars['transactions'];
        if ($authUser['providertype'] == "admin") {
            $sql = "DELETE FROM transactions WHERE id = $1";
        } else {
            $result['error'] = "Authentication failed";
        }
        break;

    case '/ipn_logs/?': // To delete sudopay ipn logs details based on Id
        $val_arr[] = $r_resource_vars['ipn_logs'];
        if ($authUser['providertype'] == "admin") {
            $sql = "DELETE FROM ipn_logs WHERE id = $1";
        } else {
            $result['error'] = "Authentication failed";
        }
        break;

    default:
        $pluginConditions = array(
            'site.enabled_plugins'
        );
        $enabledPlugins = pg_query_cache("SELECT value FROM settings WHERE name = $1 order by display_order", $pluginConditions);
        $plugin_url = array();
        if (!empty($enabledPlugins[0]['value']) && strpos($enabledPlugins[0]['value'], 'Coupons') !== false) {
            $plugin_url['Coupons'] = array(
                '/coupons/?'
            );
        }
        if (!empty($enabledPlugins[0]['value']) && strpos($enabledPlugins[0]['value'], 'CourseWishlist') !== false) {
            $plugin_url['CourseWishlist'] = array(
                '/courses/?/course_favourites',
                '/course_favourites/?'
            );
        }
        if (!empty($enabledPlugins[0]['value']) && strpos($enabledPlugins[0]['value'], 'Withdrawal') !== false) {
            $plugin_url['Withdrawal'] = array(
                '/money_transfer_accounts/?',
                '/user_cash_withdrawals/?'
            );
        }
        if (!empty($enabledPlugins[0]['value']) && strpos($enabledPlugins[0]['value'], 'RatingAndReview') !== false) {
            $plugin_url['RatingAndReview'] = array(
                '/course_user_feedbacks/?'
            );
        }
        if (!empty($enabledPlugins[0]['value']) && strpos($enabledPlugins[0]['value'], 'Subscriptions') !== false) {
            $plugin_url['Subscriptions'] = array(
                '/subscriptions/?',
                '/user_subscription_logs/?'
            );
        }
        foreach ($plugin_url as $plugin_key => $plugin_values) {
            if (in_array($r_resource_cmd, $plugin_values)) {
                $pluginToBePassed = $plugin_key;
                break;
            }
        }
        if (!empty($pluginToBePassed)) {
            require_once APP_PATH . DIRECTORY_SEPARATOR . 'server' . DIRECTORY_SEPARATOR . 'php' . DIRECTORY_SEPARATOR . 'plugins' . DIRECTORY_SEPARATOR . $pluginToBePassed . DIRECTORY_SEPARATOR . 'R' . DIRECTORY_SEPARATOR . 'r.php';
            $passed_values = array();
            $passed_values['val_arr'] = $val_arr;
            $passed_values['sql'] = $sql;
            $passed_values['r_resource_cmd'] = $r_resource_cmd;
            $passed_values['r_resource_vars'] = $r_resource_vars;
            $passed_values['r_resource_filters'] = $r_resource_filters;
            $passed_values['authUser'] = $authUser;
            $plugin_return = call_user_func($plugin_key . '_r_delete', $passed_values);
            foreach ($plugin_return as $return_plugin_key => $return_plugin_values) {
                $ {
                    $return_plugin_key
                } = $return_plugin_values;
            }
        }
    }
    if (!empty($sql) && $bulk_delete == 0) {
        $result = pg_execute_query($sql, $val_arr);
        if ($result) {
            if ($r_resource_cmd == '/course_users/?') { // To update revenue count details on Courses table based on Course user Id
                _updateRevenue($courseUserData['course_id'], $courseUserData['user_id']);
                if (!empty($courseUserData['coupon_id'])) {
                    _updateCouponCount($courseUserData['coupon_id']);
                }
                $data = array(
                    $courseUserData['amount'],
                    $courseUserData['teacher_user_id']
                );
                if ($courseUserData['course_user_status_id'] != ConstCourseUserStatuses::PaymentPending && $courseUserData['amount'] > 0) {
                    pg_execute_query("UPDATE users SET  available_balance = (available_balance - $1) WHERE id = $2", $data);
                }
            }
            if ($r_resource_cmd == '/users/?') {
                $emailFindReplace['##USERNAME##'] = $user_detail['displayname'];
                $emailFindReplace['to'] = $user_detail['email'];
                $emailFindReplace['mail'] = 'Admin User Delete';
                r_mail($emailFindReplace);
            }
            if ($r_resource_cmd == '/courses/?' and !empty($course_data['user_id'])) {
                _updateIsTeacher($course_data['user_id']);
            }
        }
        $response['error'] = array(
            'code' => isset($result['error']) ? 1 : 0,
            'reason' => isset($result['error']) ? $result['error'] : 'Delete Successfully'
        );
    } else {
        $response['error'] = array(
            'code' => 1,
            'reason' => isset($result['error']) ? $result['error'] : 'Error'
        );
    }
    echo json_encode($response);
}
global $post_exception_url, $put_exception_url, $exception_before_token, $exception_url, $admin_access_url, $put_admin_access_url;
$post_exception_url = array(
    '/users/login',
    '/users/register',
    '/users/forgotpassword',
    '/users/social_login',
    '/categories',
    '/auth',
    '/online_course_lesson_views',
    '/contacts'
);
$put_exception_url = array(
    '/users/activation',
    '/users/check_subscribe'
);
$exception_before_token = array(
    '/token',
    '/auth',
    '/settings',
    '/providers',
    '/categories',
    '/settings/site_languages',
);
$exception_url = array(
    '/plugins',
    '/auth',
    '/token',
    '/courses',
    '/courses/?',
    '/categories/?/courses',
    '/categories',
    '/categories/?',
    '/online_course_lessons',
    '/online_course_lessons/?',
    '/courses/?/online_course_lessons',
    '/users/?',
    '/courses/?/course_user_feedbacks',
    '/image_upload',
    '/users/?/courses',
    '/languages',
    '/instructional_levels',
    '/course_user_feedbacks',
    '/users',
    '/settings',
    '/subscriptions',
    '/categories/?/courses/?/related',
    '/users/?/courses/?/related',
    '/providers',
    '/users/?/course_users',
    '/users/?/course_favourites',
    '/instructional_levels_subscriptions',
    '/page/?',
    '/pages/?',
    '/settings/site_languages',
    '/online_course_lessons/?/neighbours',
    '/plugins'
);
$admin_access_url = array(
    '/admin/stats',
    '/admin/activities',
    '/admin/overview',
    '/mooc_affiliate_synchronize',
    '/sudopay_synchronize',
    '/setting_categories/?/settings',
    '/setting_categories/?',
    '/settings/?',
    '/subscription_statuses',
    '/user_subscription_logs/?'
);
$put_admin_access_url = array(
    '/settings/?',
    '/pages/?',
    '/setting_categories/?/settings',
);
main();
