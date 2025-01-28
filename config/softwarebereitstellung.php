<?php
// Define Studienjahr to start in Studienjahr-Dropdownlist.
$config['studienjahr_dropdown_startdate'] = '2024/25';

// Define OTOBO link for requesting new Software.
$config['otobo_url'] = 'https://services.technikum-wien.at/otobo/customer.pl?Action=CustomerTicketMessage;ServiceID=87;TypeID=6';

// Define Planning Deadline day and month. Year will be defined dynamically by Studienjahr.
$config['planung_deadline'] = ['day' => 30, 'month' => 4]; // 4 = April

// Define Email Adress for Softwaremanager.
$config['email_softwaremanager'] = 'licences@'. DOMAIN;