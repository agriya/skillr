Installation Steps:
-------------------
### Server Requirements

    ** PHP Version - 5.4+ (preferably 5.6)
        Extensions
            GD Version - 2.x+
            PCRE Version - 7.x+
            cURL version - 7.x+
            JSON version - 1.x+
            Freetype
            mbstring
            ffmpeg
            pdo_pgsql should enabled
        php.ini settings
            max_execution_time - 180 (not mandatory)
            max_input_time - 6000 (not mandatory)
            memory_limit - 128M (at least 32M)
            safe_mode - off
            open_basedir - No Value
            display_error = On
            magic_quotes_gpc = Off
    ** PostgreSQL Version - 9.3+ (preferably 9.3)
    ** Nginx OR Apache - 1+ (preferably 2+)
        Apache - Modules
            mod_rewrite
            mod_deflate (not mandatory, but highly recommended for better performance–gzip)
            mod_expires (not mandatory, but highly recommended for better performance–browser caching)
    Recommended Linux distributions: Centos / Ubuntu / RedHat

### Used Technologies

    AngularJS 1.5.2
    PHP
    PostgreSQL
    Twitter Bootstrap 3.1.1

### Initial Configurations

* Files Setup

    	Unzip product zip file and upload to your server.

* Unzipped folder contains following directories

		- /client
		- /media
		- /sample
		- /script
		- /server
		- /sql
		- /tmp
		- .htaccess

### Database setup

'sql/course_with_empty_data.sql' - Database generation script, import the database through phpPgAdmin or command.

  	psql -d your_db_name -f /your_server_path/sql/course_with_empty_data.sql

'/server/php/config.inc.php' - For database and other configurations.

(  
  define('R_DB_HOST', 'localhost');
  define('R_DB_USER', 'ENTER DB USER HERE');
  define('R_DB_PASSWORD', 'ENTER DB PASSWORD HERE');
  define('R_DB_NAME', 'ENTER DB NANE HERE');
)

### Site logo setup

There are few places where site logo are located. To change those logo, you need to replace your logo with exact name and resolution in the following mentioned directories.

    client/assets/img/logo.php - 100 x 34
    client/assets/favicon.icon - 16 x 16
    client/assets/apple-touch-icon.png - 57 x 57
    client/assets/apple-touch-icon-72×72.png - 72 x 72
    client/assets/apple-touch-icon-114×114.png - 114 x 114
    client/assets/img/logo-600×315.png - 600 x 315

### File permission setup

Make sure the permission as read, write and executable as recursively for the below directories. (Need write permission 777)

	- /media
	- /tmp
	- /client/assets
	- /server/php/plugins/Subscriptions/shell
	- /server/php/plugins/VideoLessons/shell

### Cron setup

Setup the cron with the following command

* For VideoLessons

 		*/2 * * * * /$root_path/server/php/plugins/VideoLessons/shell/convert_video.sh 1>> /$root/tmp/logs/shell.log 2>> /$root/tmp/logs/shell.log

* For Subscriptions 

		*/2 * * * * /$root_path/server/php/plugins/Subscriptions/shell/update_subscription_status.sh 1>> /$root/tmp/logs/shell.log 2>> /$root/tmp/logs/shell.log

* How to Configure Site Settings

Login with below admin credentials.

		Username: admin
        Email: productdemo.admin@gmail.com
        Password: agriya

Go to users menu, and update your email and password.

For site relating settings, got to settings menu and manage your settings.
