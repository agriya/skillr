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
class ConstSettingCategories
{
    const Site = 1;
    const SEOAndMetadata = 2;
    const Revenue = 3;
    const SudoPay = 4;
    const Withdrawal = 5;
    const Analytics = 6;
    const MOOCAffiliate = 7;
    const SocialNetworks = 8;
    const Course = 9;
    const Comments = 10;
    const Plugins = 11;
    const PayPal = 12;
    const Banner = 13;
    const VideoLessons = 14;
}
class ConstWithdrawalStatuses
{
    const Pending = 1;
    const UnderProcess = 2;
    const Rejected = 3;
    const AmountTransferred = 4;
}
class ConstCourseStatuses
{
    const Draft = 1;
    const WaitingForApproval = 2;
    const Active = 3;
}
class ConstCourseUserStatuses
{
    const PaymentPending = 1;
    const NotStarted = 2;
    const InProgress = 3;
    const Completed = 4;
    const Archived = 5;
}
class ConstSubscriptionStatuses
{
    const Initiated = 1;
    const Active = 2;
    const PendingPayment = 3;
    const Canceled = 4;
    const Expired = 5;
}
class ConstOnlineLessonTypes
{
    const Article = 1;
    const Document = 2;
    const Video = 3;
    const VideoExternal = 4;
    const DownloadableFile = 5;
    const PlaceHolder = 6;
}
class ConstPaymentGateways
{
    const PayPal = 1;
    const SudoPay = 2;
}
class ConstTransactionTypes
{
    const CourseBooking = 1;
}
?>