# Node-IRC-Daemon
A nodejs irc daemon with a web interface!

This application can join multiple servers and connect to several channels on each server and will log all
messages unless the application is told to leave that channel at which point the server will wipe the log
of the channel. Please note that PM's are not removed at any point. The server will loose the log if the
application closes.

The application will not leave a channel unless it is forced to by an operator or if the client tells it to.
The application will stay connected to the servers and the rooms it was told to if you close the client and
all messages are kept for when you reopen the client.

Ping notifications will only work if you have your sound on or, if selected, desktop notifications. You will
not get pinged if the client was closed and then reopened, although the client will highlight all messages that
match your keywords.

The application by default should be set to reconnect to an irc server on disconnect, this is for when you may get
disconnected from the server but would like to reconnect automatically. Message logs are not lost on a reconnect.

On startup the application will join the set list of servers and channels that are in your config file. All channels
joined whilst the application is open are lost after a restart so if you want to rejoin a channel on restart you should
add it to the config. If the application looses connection to the irc server but does not restart the application then
it will rejoin the channels that had been joined before the connection was lost.

# Setup
1. Clone this program from the git repo
2. Make sure nodejs is installed and npm
3. Run "npm install" when in the main application directory
4. Copy the config-example.json file to config.json
5. Fill in the config.json file (Most settings can be changed on the settings page)
6. Run the application and browse to the ip and port it is running on (For optimal running I recommend using screen)

# License
This application is licensed under GNU GPL V3 license in which it states that I am not liable for any issues that
might arise from using this application.

Some parts of this program use their own licence which has still been included in their correct directories.

# Support
If you find a bug feel free to report it and if you can, try to fix it with a pull request!