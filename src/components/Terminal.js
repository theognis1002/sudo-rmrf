'use client';
import { useState, useEffect, useRef } from 'react';
import Terminal from 'react-console-emulator';

// Custom function to format output with styled links
const formatOutput = (text) => {
    if (!text) return text;

    const urlRegex = /(https?:\/\/[^\s]+)/g;
    if (!text.match(urlRegex)) return text;

    // Return an array of strings and styled objects
    return text.split(urlRegex).map((part, i) => {
        if (part.match(urlRegex)) {
            return {
                text: part,
                style: {
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    color: '#0F0'
                }
            };
        }
        return part;
    });
};

export default function ConsoleTerminal() {
    const terminalRef = useRef(null);
    const [currentPath, setCurrentPath] = useState('/home/root');
    const [promptLabel, setPromptLabel] = useState('root@sudo-rm-rf.io:~# ');
    const [fileSystem, setFileSystem] = useState({
        '/': {
            type: 'dir',
            children: {
                'home': {
                    type: 'dir',
                    children: {
                        'root': {
                            type: 'dir',
                            children: {
                                'lazarus.exe': { type: 'file', permissions: '-rw-r--r--', content: 'Backdoor opened!' },
                                'secret_files.txt': { type: 'file', permissions: '-rw-r--r--', content: 'DATABASE_URI=admin:password123!@supabase.io:27017/database' },
                                'matrix.dat': { type: 'file', permissions: '-rw-r--r--', content: 'Follow the white rabbit...' },
                                'encrypted.db': { type: 'file', permissions: '-rw-r--r--' },
                                'discord.txt': { type: 'file', content: '<b>sudo rm -rf</b> — a community for cybersecurity, DevSecOps, hacking, and programming.\n\nDiscuss exploits, harden systems, write code — responsibly.\n\nJoin our Discord community: <a href="https://discord.gg/5h6cMV6SbZ">https://discord.gg/5h6cMV6SbZ</a>' }
                            }
                        }
                    }
                }
            }
        }
    });
    const [output, setOutput] = useState(null);

    // Update prompt label whenever path changes
    useEffect(() => {
        const displayPath = currentPath === '/home/root' ? '~' : currentPath;
        setPromptLabel(`root@sudo-rm-rf.io:${displayPath}# `);
    }, [currentPath]);

    // Helper function to get current directory object
    const getCurrentDir = () => {
        if (currentPath === '/') {
            return fileSystem['/'];
        }
        const parts = currentPath.split('/').filter(Boolean);
        let current = fileSystem['/'];
        for (const part of parts) {
            if (!current.children || !current.children[part]) {
                throw new Error(`Path not found: ${currentPath}`);
            }
            current = current.children[part];
        }
        return current;
    };

    // Helper function to resolve path
    const resolvePath = (path) => {
        // Handle home directory
        if (path.startsWith('~/')) {
            path = path.replace('~/', '/home/root/');
        } else if (path === '~') {
            path = '/home/root';
        }

        // Handle absolute paths
        if (path.startsWith('/')) {
            const parts = path.split('/').filter(Boolean);
            let current = fileSystem['/'];

            // Verify each part of the path exists
            for (const part of parts) {
                if (part === '..') {
                    // Remove the last part from the path
                    parts.splice(parts.indexOf(part) - 1, 2);
                } else if (part !== '.') {
                    if (!current.children || !current.children[part]) {
                        throw new Error(`${path}: No such directory`);
                    }
                    current = current.children[part];
                }
            }

            return '/' + parts.join('/');
        }

        // Handle relative paths
        const currentParts = currentPath.split('/').filter(Boolean);
        const newParts = path.split('/').filter(Boolean);

        for (const part of newParts) {
            if (part === '..') {
                if (currentParts.length > 0) {
                    currentParts.pop();
                }
            } else if (part !== '.') {
                currentParts.push(part);
            }
        }

        return '/' + currentParts.join('/');
    };

    // Helper function to check if path exists and is of correct type
    const checkPath = (path, type = null) => {
        const parts = path.split('/').filter(Boolean);
        let current = fileSystem['/'];

        for (const part of parts) {
            if (!current.children || !current.children[part]) {
                return false;
            }
            current = current.children[part];
        }

        return type ? current.type === type : true;
    };

    // Helper function to create directory
    const createDirectory = (path, recursive = false) => {
        const parts = path.split('/').filter(Boolean);
        let current = fileSystem['/'];
        let currentPath = '';

        for (const part of parts) {
            currentPath += '/' + part;
            if (!current.children) {
                current.children = {};
            }

            if (!current.children[part]) {
                if (!recursive && parts.indexOf(part) < parts.length - 1) {
                    throw new Error(`Parent directory ${currentPath} does not exist`);
                }
                current.children[part] = {
                    type: 'dir',
                    children: {}
                };
            } else if (current.children[part].type !== 'dir') {
                throw new Error(`${currentPath} exists but is not a directory`);
            }

            current = current.children[part];
        }
    };

    const processes = [
        { pid: '1234', cmd: 'system_core', cpu: '2.5%', mem: '150MB' },
        { pid: '5678', cmd: 'slack', cpu: '1.8%', mem: '80MB' },
        { pid: '5678', cmd: 'discord', cpu: '5.8%', mem: '103MB' },
        { pid: '9012', cmd: 'wraith_scan', cpu: '5.2%', mem: '332MB' },
        { pid: '3456', cmd: 'matrix_scan', cpu: '3.0%', mem: '284MB' }
    ];

    // Helper function for tab completion
    const getCompletions = (input) => {
        if (!input || typeof input !== 'string') {
            return [];
        }

        const parts = input.trim().split(' ');
        const lastWord = parts[parts.length - 1].toLowerCase();

        // If we're typing a path
        if (parts.length > 1 && ['cd', 'mkdir', 'rm', 'cat', 'cp'].includes(parts[0])) {
            const currentDir = getCurrentDir();
            const available = Object.keys(currentDir.children || {});
            return available.filter(name => name.toLowerCase().startsWith(lastWord));
        }

        // Command completion
        const commands = ['ls', 'ps', 'rm', 'sudo', 'clear', 'help', 'cat', 'echo', 'pwd', 'cd', 'mkdir', 'cp', 'grep'];
        return commands.filter(cmd => cmd.startsWith(lastWord));
    };

    // Handle keyboard shortcuts and tab completion
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Handle Cmd+K or Ctrl+L (clear terminal)
            if ((e.metaKey && e.key === 'k') || (e.ctrlKey && e.key === 'l')) {
                e.preventDefault();
                if (terminalRef.current) {
                    terminalRef.current.clearStdout();
                }
            }

            // Handle tab completion
            if (e.key === 'Tab' && terminalRef.current) {
                e.preventDefault();
                const input = terminalRef.current.terminalInput.value || '';
                const completions = getCompletions(input);

                if (completions.length === 1) {
                    // If there's only one completion, use it
                    const parts = input.split(' ');
                    parts[parts.length - 1] = completions[0];
                    terminalRef.current.terminalInput.value = parts.join(' ');
                } else if (completions.length > 1) {
                    // If there are multiple completions, show them
                    terminalRef.current.pushToStdout(completions.join('  '));
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Add click handler for links
    useEffect(() => {
        const handleClick = (e) => {
            const text = e.target.textContent;
            const urlMatch = text && text.match(/https?:\/\/[^\s]+/);
            if (urlMatch) {
                window.open(urlMatch[0], '_blank');
            }
        };

        // Find the terminal output element
        const terminalOutput = document.querySelector('.react-console-emulator');
        if (terminalOutput) {
            terminalOutput.style.cursor = 'pointer';
            terminalOutput.addEventListener('click', handleClick);
        }

        return () => {
            const terminalOutput = document.querySelector('.react-console-emulator');
            if (terminalOutput) {
                terminalOutput.removeEventListener('click', handleClick);
            }
        };
    }, []);

    // Helper function to handle command output
    const handleOutput = (text) => {
        setOutput(formatOutput(text));
        return text;
    };

    const commands = {
        clear: {
            description: 'Clear the terminal screen',
            usage: 'clear',
            fn: () => {
                if (terminalRef.current) {
                    terminalRef.current.clearStdout();
                }
                return '';
            }
        },
        cd: {
            description: 'Change directory',
            usage: 'cd <path>',
            fn: (path = '~') => {
                try {
                    const resolvedPath = resolvePath(path);
                    if (!checkPath(resolvedPath, 'dir')) {
                        return `cd: ${path}: No such directory`;
                    }
                    setCurrentPath(resolvedPath);
                    return '';
                } catch (error) {
                    return `cd: ${error.message}`;
                }
            }
        },
        mkdir: {
            description: 'Make directories',
            usage: 'mkdir [-p] <directory>',
            fn: (...args) => {
                try {
                    let recursive = false;
                    let paths = [...args];

                    // Handle -p flag
                    if (paths[0] === '-p') {
                        recursive = true;
                        paths.shift();
                    }

                    if (paths.length === 0) {
                        return 'mkdir: missing operand';
                    }

                    for (const path of paths) {
                        const resolvedPath = resolvePath(path);
                        if (checkPath(resolvedPath)) {
                            return `mkdir: cannot create directory '${path}': File exists`;
                        }
                        createDirectory(resolvedPath, recursive);
                    }
                    return '';
                } catch (error) {
                    return `mkdir: ${error.message}`;
                }
            }
        },
        pwd: {
            description: 'Print working directory',
            usage: 'pwd',
            fn: () => {
                return currentPath;
            }
        },
        ls: {
            description: 'List directory contents',
            usage: 'ls',
            fn: () => {
                try {
                    const currentDir = getCurrentDir();
                    if (!currentDir.children) {
                        return '';
                    }

                    // If we're not at root, add '..' for parent directory
                    let entries = currentPath === '/' ? [] : [];

                    // Add all directory contents
                    entries = entries.concat(
                        Object.entries(currentDir.children).map(([name, item]) => {
                            return item.type === 'dir' ? name + '/' : name;
                        })
                    );

                    return entries.join('\n');
                } catch (error) {
                    return `ls: ${error.message}`;
                }
            }
        },
        ps: {
            description: 'Display running processes',
            usage: 'ps',
            fn: () => {
                return processes.map(p =>
                    `${p.pid}\t${p.cmd}\t${p.cpu}\t${p.mem}`
                ).join('\n');
            }
        },
        cat: {
            description: 'Display file contents',
            usage: 'cat <filename>',
            fn: (filename) => {
                if (!filename) {
                    return 'Usage: cat <filename>';
                }

                const resolvedPath = resolvePath(filename);
                if (!checkPath(resolvedPath, 'file')) {
                    return `cat: ${filename}: No such file`;
                }

                // Get file content
                const parts = resolvedPath.split('/').filter(Boolean);
                let current = fileSystem['/'];
                for (const part of parts) {
                    current = current.children[part];
                }

                return current.content || 'File is empty or binary.';
            }
        },
        grep: {
            description: 'Search for PATTERN in files',
            usage: 'grep <pattern> [path]',
            fn: (...args) => {
                if (args.length === 0) {
                    return 'Usage: grep <pattern> [path]';
                }

                const patternRaw = args[0];
                const pattern = patternRaw.replace(/^['"]|['"]$/g, '');

                // Determine search target: file / dir / current dir
                let targetPath;
                if (args.length >= 2) {
                    try {
                        targetPath = resolvePath(args[1]);
                    } catch (err) {
                        return `grep: ${args[1]}: No such file or directory`;
                    }
                    if (!checkPath(targetPath)) {
                        return `grep: ${args[1]}: No such file or directory`;
                    }
                } else {
                    // No path provided: use current directory
                    targetPath = currentPath;
                }

                const results = [];

                const searchNode = (node, path) => {
                    if (node.type === 'file') {
                        const content = node.content || '';
                        const lines = content.split('\n');
                        lines.forEach((line, idx) => {
                            if (line.includes(pattern)) {
                                results.push(`${path}:${idx + 1}:${line}`);
                            }
                        });
                    } else if (node.type === 'dir' && node.children) {
                        Object.entries(node.children).forEach(([name, child]) => {
                            searchNode(child, path === '/' ? `/${name}` : `${path}/${name}`);
                        });
                    }
                };

                // Get starting node
                let startNode = fileSystem['/'];
                if (targetPath !== '/') {
                    const parts = targetPath.split('/').filter(Boolean);
                    for (const part of parts) {
                        startNode = startNode.children[part];
                    }
                }

                searchNode(startNode, targetPath === '' ? '/' : targetPath);

                return results.join('\n');
            }
        },
        echo: {
            description: 'Display a line of text',
            usage: 'echo <text>',
            fn: (...args) => {
                if (args.length === 0) return '';
                // Remove quotes from the beginning and end of each argument
                const unquotedArgs = args.map(arg => arg.replace(/^["']|["']$/g, ''));
                return unquotedArgs.join(' ');
            }
        },
        rm: {
            description: 'Remove a file',
            usage: 'rm [-rf] <filename>',
            fn: (...args) => {
                let filename;

                // Support both rm file.txt and rm -rf file.txt
                if (args[0] === '-rf') {
                    if (args.length < 2) return 'rm: missing operand';
                    filename = args.slice(1).join(' ');
                } else {
                    if (args.length < 1) return 'rm: missing operand';
                    filename = args.join(' ');
                }

                const resolvedPath = resolvePath(filename);

                if (!checkPath(resolvedPath)) {
                    return `rm: ${filename}: No such file or directory`;
                }

                // Get the node to check if it's a directory
                const parts = resolvedPath.split('/').filter(Boolean);
                const name = parts.pop();
                let current = fileSystem['/'];
                for (const part of parts) {
                    current = current.children[part];
                }

                // If it's a directory and -rf wasn't used, return error
                if (current.children[name].type === 'dir' && args[0] !== '-rf') {
                    return `rm: ${filename}: is a directory`;
                }

                delete current.children[name];
                setFileSystem({ ...fileSystem }); // Trigger re-render

                return '';
            }
        },
        cp: {
            description: 'Copy files or directories',
            usage: 'cp [-r] <source> <destination>',
            fn: (...args) => {
                let recursive = false;
                if (args[0] === '-r') {
                    recursive = true;
                    args.shift();
                }

                if (args.length < 2) {
                    return 'cp: missing operand';
                }
                if (args.length > 2) {
                    return 'cp: too many operands';
                }

                const [srcPathArg, destPathArg] = args;
                let srcPath, destPath;
                try {
                    srcPath = resolvePath(srcPathArg);
                    destPath = resolvePath(destPathArg);
                } catch (err) {
                    return `cp: ${err.message}`;
                }

                if (!checkPath(srcPath)) {
                    return `cp: cannot stat '${srcPathArg}': No such file or directory`;
                }

                // Helper to deep clone a node
                const cloneNode = (node) => JSON.parse(JSON.stringify(node));

                const srcParts = srcPath.split('/').filter(Boolean);
                const destParts = destPath.split('/').filter(Boolean);

                // Locate source node & parent
                let srcParent = fileSystem['/'];
                for (let i = 0; i < srcParts.length - 1; i++) {
                    srcParent = srcParent.children[srcParts[i]];
                }
                const srcName = srcParts[srcParts.length - 1];
                const srcNode = srcParent.children[srcName];

                // If source is dir and recursive flag not set -> error
                if (srcNode.type === 'dir' && !recursive) {
                    return `cp: -r not specified; omitting directory '${srcPathArg}'`;
                }

                // Determine destination parent and name
                let destParent = fileSystem['/'];
                for (let i = 0; i < destParts.length - 1; i++) {
                    const part = destParts[i];
                    if (!destParent.children || !destParent.children[part]) {
                        // Auto-create intermediate dirs?
                        return `cp: cannot create directory '${destPathArg}': No such file or directory`;
                    }
                    destParent = destParent.children[part];
                }
                const destNameCandidate = destParts[destParts.length - 1];

                // If destination exists and is directory, copy inside
                if (checkPath(destPath, 'dir')) {
                    destParent = destParent.children[destNameCandidate];
                    destParent.children = destParent.children || {};
                    destParent.children[srcName] = cloneNode(srcNode);
                } else {
                    // Destination is file path (may overwrite)
                    destParent.children = destParent.children || {};
                    destParent.children[destNameCandidate] = cloneNode(srcNode);
                }

                setFileSystem({ ...fileSystem });
                return '';
            }
        },
        chmod: {
            description: 'Change file permissions',
            usage: 'chmod +x <filename>',
            fn: (...args) => {
                if (args.length !== 2 || args[0] !== '+x') {
                    return 'Usage: chmod +x <filename>';
                }

                const filename = args[1];
                const resolvedPath = resolvePath(filename);

                if (!checkPath(resolvedPath, 'file')) {
                    return `chmod: ${filename}: No such file`;
                }

                // Get the file and update permissions
                const parts = resolvedPath.split('/').filter(Boolean);
                let current = fileSystem['/'];
                for (const part of parts) {
                    current = current.children[part];
                }

                // Update permissions to include execute
                current.permissions = current.permissions.replace('rw-', 'rwx');

                // Register the executable command (e.g., ./backdoor.exe)
                commands[`./${filename}`] = {
                    description: `Execute ${filename}`,
                    usage: `./${filename}`,
                    fn: () => current.content || 'File is empty or binary.'
                };

                setFileSystem({ ...fileSystem }); // Trigger re-render

                return '';
            }
        },
        help: {
            description: 'List all available commands',
            usage: 'help',
            fn: () => {
                return `Available commands:
pwd             - Print working directory
cd <path>       - Change directory
mkdir [-p] <dir>- Make directories
ls              - List directory contents
ps              - Show running processes
cat <file>      - Display file contents
echo <text>     - Display a line of text
rm [-rf] <file> - Remove files and directories
sudo rm -rf     - Same as rm -rf
chmod +x <file> - Make a file executable
./file          - Execute a file
clear           - Clear the terminal (Cmd+K/Ctrl+L)
help            - Show this help message
cp [-r] src dst- Copy files or directories
grep pattern file- Search for pattern in file
+grep pattern [path]- Recursively search starting at path`;
            }
        }
    };

    // Register ./filename commands for files in /home/root
    (() => {
        try {
            const rootFiles = fileSystem['/']?.children?.['home']?.children?.['root']?.children || {};
            Object.entries(rootFiles).forEach(([name, node]) => {
                if (node.type === 'file') {
                    // Only register if not already present
                    if (!commands[`./${name}`]) {
                        commands[`./${name}`] = {
                            description: `Execute ${name}`,
                            usage: `./${name}`,
                            fn: () => {
                                const resolvedPath = `/home/root/${name}`;
                                const parts = resolvedPath.split('/').filter(Boolean);
                                let current = fileSystem['/'];
                                for (const part of parts) {
                                    current = current.children[part];
                                }
                                if (!current.permissions || !current.permissions.includes('x')) {
                                    return `bash: ./${name}: Permission denied`;
                                }
                                return current.content || 'File is empty or binary.';
                            }
                        };
                    }
                }
            });
        } catch (e) {
            // Fail silently if path structure not found
        }
    })();

    // Add sudo support
    commands['sudo'] = {
        description: 'Run a command with sudo privileges',
        usage: 'sudo rm -rf <filename>',
        fn: (...args) => {
            if (args.length < 2 || args[0] !== 'rm' || args[1] !== '-rf') {
                return 'Only "sudo rm -rf" command is supported';
            }
            return commands['rm'].fn('-rf', args.slice(2).join(' '));
        }
    };

    return (
        <div className="fixed inset-0">
            {output && (
                <div
                    style={{
                        position: 'absolute',
                        zIndex: 1000,
                        color: '#0F0',
                        padding: '0.5rem',
                        fontFamily: 'monospace',
                    }}
                >
                    {output}
                </div>
            )}
            <style jsx global>{`
                @keyframes blink {
                    0% { opacity: 1; }
                    50% { opacity: 0; }
                    100% { opacity: 1; }
                }
                .react-console-emulator__cursor {
                    display: inline-block;
                    width: 0.6em;
                    height: 1em;
                    background: #0F0;
                    margin-left: 2px;
                    animation: blink 1s step-end infinite;
                }
                .react-console-emulator__input {
                    caret-color: transparent !important;
                }
                .react-console-emulator__content {
                    white-space: pre;
                }
                .react-console-emulator__inputArea {
                    display: flex;
                    flex-wrap: nowrap;
                    align-items: center;
                    width: 100%;
                    overflow-x: auto;
                }
                .react-console-emulator__inputArea > span:first-child {
                    flex: 0 0 auto;
                }
            `}</style>
            <Terminal
                ref={terminalRef}
                commands={commands}
                welcomeMessage={``}
                autoFocus={true}
                dangerMode={true}
                promptLabel={promptLabel}
                style={{
                    backgroundColor: '#000',
                    minHeight: '100%',
                    height: '100%',
                    overflow: 'auto',
                    fontFamily: 'monospace',
                    padding: '1rem',
                }}
                styleEchoBack='textOutput'
                contentStyle={{ color: '#0F0' }}
                promptLabelStyle={{
                    color: '#0F0',
                    whiteSpace: 'nowrap',
                    minWidth: 'fit-content',
                    flexShrink: 0
                }}
                inputTextStyle={{ color: '#0F0', fontWeight: 'bold' }}
                messageStyle={{
                    color: 'rgba(0, 255, 0, 0.8)',
                    fontStyle: 'italic',
                    fontSize: '0.95em'
                }}
                scrollBehavior='smooth'
                noDefaults={true}
                cursor={<span className="react-console-emulator__cursor" />}
            />
        </div>
    );
}