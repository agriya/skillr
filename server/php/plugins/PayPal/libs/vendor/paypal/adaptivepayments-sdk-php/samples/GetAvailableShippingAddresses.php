<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html>
<head>
<title>PayPal Adaptive Payments - Get Available Shipping Addresses</title>
<link href="Common/sdk.css" rel="stylesheet" type="text/css" />
<script type="text/javascript" src="Common/sdk_functions.js"></script>
<script type="text/javascript" src="Common/jquery-1.3.2.min.js"></script>
</head>
<body>
	<div id="wrapper">
		<img src="https://devtools-paypal.com/image/bdg_payments_by_pp_2line.png"/>
		<div id="header">
			<h3>Get Available Shipping Addresses</h3>
			<div id="apidetails">Use the GetAvailableShippingAddresses API operation to
				obtain the available shipping addresses for a payment.</div>
		</div>
		<div id="request_form">
			<form id="Form1" name="Form1" method="post"
				action="GetAvailableShippingAddressesReceipt.php">
				<div class="params">
					<div class="param_name">Key (Pay key or preapproval key) *</div>
					<div class="param_value">
						<input name="key" id="key"
							value="AP-23119815K9918782X" />
					</div>
				</div>				
				<div class="submit">
					<input type="submit" value="Submit" />
				</div>
			</form>
		</div>
		<a href="index.php">Home</a>
	</div>
</body>
</html>
