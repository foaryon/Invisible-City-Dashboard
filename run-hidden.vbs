' The Invisible City — start WITHOUT a console window (Windows).
' Double-click this file, or put a shortcut to it into shell:startup so the
' dashboard is always running after login. Stop it via Task-Manager (node.exe)
' or by running run.bat once and closing that window.
Set shell = CreateObject("WScript.Shell")
shell.CurrentDirectory = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
shell.Run "cmd /c run.bat", 0, False
