# bpdt
baro project developer tool

[diff] tool = winmerge

 

[merge] tool = winmerge

 

[difftool "WinMerge"]

    cmd = \"C:\\Program Files\\WinMerge\\WinMergeU.exe\" -e -u -dl \"Old $BASE\" -dr \"New $BASE\" \"$LOCAL\" \"$REMOTE\"

    trustExitCode = true

 

[mergetool "WinMerge"]

    cmd = \"C:\\Program Files\\WinMerge\\WinMergeU.exe\" -e -u -dl \"Local\" -dm \"Base\" -dr \"Remote\" \"$LOCAL\" \"$BASE\" \"$REMOTE\" -o \"$MERGED\"

    trustExitCode = true

    keepBackup = false