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
match your keywords. Highlights are done using regex.

The application by default should be set to reconnect to an irc server on disconnect, this is for when you may get
disconnected from the server but would like to reconnect automatically. Message logs are not lost on a reconnect.

On startup the application will join the set list of servers and channels that are in your config file. All channels
joined whilst the application is open are lost after a restart so if you want to rejoin a channel on restart you should
add it to the config. If the application looses connection to the irc server but does not restart the application then
it will rejoin the channels that had been joined before the connection was lost.

## Setup
1. Clone this program from the git repo
2. Make sure nodejs is installed and npm
3. Run "npm install" when in the main application directory
4. Launch the program using node app.js or any other method you have for launching nodejs applications
5. Go to whatever port was put into console on launch, the application will default to 5000 but if taken it will try for another random port
6. Follow the setup that will appear on the page.
7. Done!!

## Advanced Setup
You are always able to manually fill in the config but on start it will check for a config and if none is detected it will run in setup mode.

For some advanced features you can always run a apache proxy if you would like easier access to your client.

The client also has support for an ssl cert if you would like to use one but that has to be done manually in the config in the blank ssl settings.
By default it will launch without ssl if that is not completed. A restart of the client is needed if you do add an ssl cert.

## License
This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.
You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.

Some parts of this program use their own licence which has still been included in their correct directories.

## Support
If you find a bug feel free to report it and if you can, try to fix it with a pull request!
Or you can contact on the #node-irc-daemon channel on esper!