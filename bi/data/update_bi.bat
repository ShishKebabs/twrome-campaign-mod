 @echo off
echo This batch file should *only* be run from your local c:/romans/bi/data directory;
echo so press Ctrl-C to cancel or ...
echo
echo DELETING RUMS
DEL "models\*.rum"
DEL "models_strat\*.rum"
DEL "models_unit\*.rum"
echo DELETING LANDSCAPE MODEL GRID HEIGHTS
DEL "models_landscape\grid_heights\*.ght"
echo DELETING BUILDING ITEMS AND PHYSICAL INFO
DEL "models_building\*.bpi" /S /Q /F
DEL "models_engine\*.cmi" /S /Q /F
DEL "items\*.item" /Q /F
DEL "descr_items.db"

rem this is the extra barbarian files which are copied to the main /data directory 
echo COPYING LATEST BARBARIAN INVASION DATA TO /data.......................
echo Attempting to connect...
net use \\repository\barbarian_invasion
if ERRORLEVEL 1 goto fail_bid
echo Connected...
XCOPY "\\repository\barbarian_invasion\data\*" ..\..\data /E /C /I /D /R /Y
echo Deleting connection to \\repository\barbarian_invasion...
net use \\repository\barbarian_invasion /delete
echo ..
echo ..
echo Done.

rem this is the extra barbarian files which reside in a directory alongside the main "data" directory called "data_bi"
echo COPYING LATEST BARBARIAN INVASION DATA TO /data.......................
echo Attempting to connect...
net use \\repository\barbarian_invasion
if ERRORLEVEL 1 goto fail_bid
echo Connected...
XCOPY "\\repository\barbarian_invasion\bi\data\*" . /E /C /I /D /R /Y
echo Deleting connection to \\repository\barbarian_invasion...
net use \\repository\barbarian_invasion /delete
echo ..
echo ..
echo Done.

exit /B 0

:fail_romd
echo WARNING: FAILED TO CONNECT TO \\repository\rome_data, QUITTING!
exit /B 1

:fail_roms
echo WARNING: FAILED TO CONNECT TO \\repository\romserver_data, QUITTING!
exit /B 1

:fail_bid
echo WARNING: FAILED TO CONNECT TO \\repository\barbarian_invasion, QUITTING!
exit /B 1

