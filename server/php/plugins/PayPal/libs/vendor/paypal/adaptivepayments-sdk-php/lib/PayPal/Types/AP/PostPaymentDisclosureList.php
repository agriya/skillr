<?php
namespace PayPal\Types\AP;
use PayPal\Core\PPMessage;
/**
 *
 */
class PostPaymentDisclosureList extends PPMessage
{
    /**
     *
     * @array
     * @access public
     * @var PayPal\Types\AP\PostPaymentDisclosure
     */
    public $postPaymentDisclosure;
}
