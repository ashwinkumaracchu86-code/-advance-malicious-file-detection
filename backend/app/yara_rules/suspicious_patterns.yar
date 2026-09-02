rule PE_Header_Detection {
    meta:
        description = "Detects Windows PE executable headers"
        author = "Malicious File Detection System"
        date = "2024-01-01"
        severity = "info"
        reference = "https://en.wikipedia.org/wiki/Portable_Executable"

    strings:
        $mz = { 4D 5A }
        $pe_sig = "PE"
        $dos_stub = "This program cannot be run in DOS mode"

    condition:
        $mz at 0 and ($pe_sig or $dos_stub)
}

rule ELF_Header_Detection {
    meta:
        description = "Detects Linux ELF executable headers"
        author = "Malicious File Detection System"
        date = "2024-01-01"
        severity = "info"
        reference = "https://en.wikipedia.org/wiki/Executable_and_Linkable_Format"

    strings:
        $elf = { 7F 45 4C 46 }

    condition:
        $elf at 0
}

rule PowerShell_Suspicious {
    meta:
        description = "Detects suspicious PowerShell patterns"
        author = "Malicious File Detection System"
        date = "2024-01-01"
        severity = "high"

    strings:
        $ps1 = "powershell" nocase
        $ps2 = "Invoke-Expression" nocase
        $ps3 = "IEX" nocase
        $ps4 = "DownloadString" nocase
        $ps5 = "DownloadFile" nocase
        $ps6 = "Net.WebClient" nocase
        $ps7 = "Start-Process" nocase
        $ps8 = "Invoke-WebRequest" nocase
        $ps9 = "Hidden" nocase
        $ps10 = "-WindowStyle Hidden" nocase
        $ps11 = "Bypass" nocase
        $ps12 = "-ExecutionPolicy Bypass" nocase
        $ps13 = "Invoke-Mimikatz" nocase
        $ps14 = "Invoke-Shellcode" nocase
        $ps15 = "Empire" nocase

    condition:
        3 of them
}

rule Bash_Suspicious {
    meta:
        description = "Detects suspicious bash/shell script patterns"
        author = "Malicious File Detection System"
        date = "2024-01-01"
        severity = "high"

    strings:
        $sh1 = "#!/bin/bash" nocase
        $sh2 = "#!/bin/sh" nocase
        $sh3 = "curl" nocase
        $sh4 = "wget" nocase
        $sh5 = "chmod" nocase
        $sh6 = "/dev/tcp" nocase
        $sh7 = "eval" nocase
        $sh8 = "base64" nocase
        $sh9 = "nc -e" nocase
        $sh10 = "ncat" nocase
        $sh11 = "python -c" nocase
        $sh12 = "perl -e" nocase
        $sh13 = "ruby -e" nocase
        $sh14 = "crontab" nocase
        $sh15 = "/etc/cron" nocase

    condition:
        ($sh1 or $sh2) and 3 of ($sh3, $sh4, $sh5, $sh6, $sh7, $sh8, $sh9, $sh10, $sh11, $sh12, $sh13, $sh14, $sh15)
}

rule Embedded_URLs {
    meta:
        description = "Detects embedded URLs that may indicate C2 communication"
        author = "Malicious File Detection System"
        date = "2024-01-01"
        severity = "medium"

    strings:
        $url1 = /https?:\/\/[a-zA-Z0-9._-]+\.[a-zA-Z]{2,}/
        $pastebin = "pastebin.com" nocase
        $github_raw = "raw.githubusercontent.com" nocase
        $ngrok = "ngrok.io" nocase
        $serveo = "serveo.net" nocase

    condition:
        ($url1 and $pastebin) or ($url1 and $github_raw) or $ngrok or $serveo
}

rule Generic_Malware_Patterns {
    meta:
        description = "Detects generic patterns commonly found in malware"
        author = "Malicious File Detection System"
        date = "2024-01-01"
        severity = "high"

    strings:
        $mutex = "CreateMutex" nocase
        $inject = "VirtualAllocEx" nocase
        $write = "WriteProcessMemory" nocase
        $create = "CreateRemoteThread" nocase
        $reg1 = "RegSetValueEx" nocase
        $reg2 = "HKEY_LOCAL_MACHINE" nocase
        $persist = "CurrentVersion\\Run" nocase
        $persist2 = "CurrentVersion\\RunOnce" nocase
        $svc = "ServiceMain" nocase
        $anti_dbg = "IsDebuggerPresent" nocase
        $anti_vm = "VMware" nocase
        $anti_vm2 = "VirtualBox" nocase
        $anti_vm3 = "Sandboxie" nocase
        $keylog = "SetWindowsHookEx" nocase
        $screen = "BitBlt" nocase
        $encrypt = "CryptEncrypt" nocase
        $decrypt = "CryptDecrypt" nocase

    condition:
        4 of them
}

rule Ransomware_Indicators {
    meta:
        description = "Detects indicators commonly found in ransomware"
        author = "Malicious File Detection System"
        date = "2024-01-01"
        severity = "critical"

    strings:
        $bitcoin = "bitcoin" nocase
        $wallet = "wallet" nocase
        $ransom = "ransom" nocase
        $encrypt = "encrypt" nocase
        $decrypt = "decrypt" nocase
        $pay = "pay" nocase
        $tor = ".onion" nocase
        $bitcoin_addr = /[13][a-km-zA-HJ-NP-Z1-9]{25,34}/
        $aes = "AES" nocase
        $rsa = "RSA" nocase
        $extensions1 = ".locked" nocase
        $extensions2 = ".encrypted" nocase
        $extensions3 = ".crypted" nocase
        $extensions4 = ".crypto" nocase
        $note = "DECRYPT" nocase
        $note2 = "RANSOM" nocase
        $note3 = "README" nocase

    condition:
        3 of ($bitcoin, $wallet, $ransom, $encrypt, $decrypt, $pay, $tor, $note, $note2, $note3) or
        ($bitcoin_addr and 2 of ($aes, $rsa, $encrypt, $decrypt)) or
        2 of ($extensions1, $extensions2, $extensions3, $extensions4)
}

rule Suspicious_Script_Obfuscation {
    meta:
        description = "Detects obfuscated script patterns"
        author = "Malicious File Detection System"
        date = "2024-01-01"
        severity = "high"

    strings:
        $eval1 = "eval(" nocase
        $eval2 = "eval (" nocase
        $exec1 = "exec(" nocase
        $exec2 = "exec (" nocase
        $fromCharCode = "fromCharCode" nocase
        $unescape = "unescape(" nocase
        $atob = "atob(" nocase
        $btoa = "btoa(" nocase
        $char_replace = /String\.fromCharCode\(/
        $split1 = /\\.split\(/ nocase
        $join1 = /\\.join\(/ nocase
        $replace1 = /\\.replace\(/ nocase
        $concat = /\\+=\s*String\.fromCharCode/

    condition:
        ($eval1 or $eval2 or $exec1 or $exec2) and 2 of ($fromCharCode, $unescape, $atob, $btoa, $char_replace, $split1, $join1, $replace1, $concat)
}

rule Credential_Harvesting {
    meta:
        description = "Detects patterns used for credential harvesting"
        author = "Malicious File Detection System"
        date = "2024-01-01"
        severity = "critical"

    strings:
        $mimikatz = "mimikatz" nocase
        $lazagne = "lazagne" nocase
        $hashdump = "hashdump" nocase
        $sam = "SAM" nocase
        $lsa = "LSASS" nocase
        $ntlm = "NTLM" nocase
        $kerberos = "kerberos" nocase
        $credential = "credential" nocase
        $password = "password" nocase
        $keylog = "keylog" nocase
        $dump = "dump" nocase
        $chrome_logins = "logins.json" nocase
        $firefox_logins = "signons.sqlite" nocase
        $wifi = "netsh wlan show" nocase

    condition:
        3 of them
}

rule Macro_Document {
    meta:
        description = "Detects documents with potentially malicious macros"
        author = "Malicious File Detection System"
        date = "2024-01-01"
        severity = "high"

    strings:
        $vba_project = "_VBA_PROJECT" nocase
        $macro = "macros" nocase
        $auto_open = "Auto_Open" nocase
        $auto_open2 = "Document_Open" nocase
        $auto_open3 = "Workbook_Open" nocase
        $shell = "Shell(" nocase
        $shell2 = "Shell " nocase
        $powershell = "powershell" nocase
        $wscript = "wscript" nocase
        $cmd = "cmd.exe" nocase
        $create = "CreateObject" nocase
        $download = "URLDownloadToFile" nocase
        $run = "Run(" nocase
        $application_run = "Application.Run" nocase

    condition:
        ($vba_project and $macro) and 2 of ($auto_open, $auto_open2, $auto_open3, $shell, $shell2, $powershell, $wscript, $cmd, $create, $download, $run, $application_run)
}
