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
function Translations_r_get($passed_values)
{
    foreach ($passed_values as $key => $values) {
        $ {
            $key
        } = $values;
    }
    switch ($r_resource_cmd) {
    case '/settings/site_languages': // site settings details
        $sql = '';
        $response = array();
        $_conditions = array(
            'site.site_languages',
            'site.default_language'
        );
        $site_language_settings = pg_query_cache("SELECT value FROM settings WHERE name in ($1, $2) ", $_conditions);
        if (!empty($site_language_settings)) {
            foreach ($site_language_settings as $site_language_setting) {
                $site_languages = explode(',', $site_language_setting['value']);
                if (!empty($site_languages)) {
                    $conditions = ' (';
                    foreach ($site_languages as $site_language) {
                        $conditions.= "'" . $site_language . "', ";
                    }
                    $conditions = rtrim($conditions, ', ') . ') ';;
                }
                if (count($site_languages) > 1) {
                    $response['site_languages'] = pg_query_cache("SELECT id,name,iso2 FROM languages WHERE iso2 IN " . $conditions . " order by name ASC");
                } else {
                    $response['preferredLocale'] = pg_query_cache("SELECT id,name,iso2 FROM languages WHERE iso2 IN " . $conditions . " order by name ASC");
                }
            }
        }
        break;
    }
    $return_plugin['sort'] = $sort;
    //$return_plugin['c_sql'] = $c_sql;
    $return_plugin['sql'] = $sql;
    $return_plugin['field'] = $field;
    $return_plugin['sort_by'] = $sort_by;
    $return_plugin['query_timeout'] = $query_timeout;
    $return_plugin['limit'] = $limit;
    $return_plugin['conditions'] = $conditions;
    //$return_plugin['where'] =$where;
    $return_plugin['val_arr'] = $val_arr;
    $return_plugin['response'] = $response;
    return $return_plugin;
}
?>