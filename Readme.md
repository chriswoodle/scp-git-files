# scp-git-files

This cli tool will copy files from a directory, following its `.gitignore`, to a remote host using scp. You do not have to commit changes to use this tool, so it can be useful for testing. 

Great for quick raspberry pi nodejs projects.

# Install

```
npm i scp-git-files -g
```

# Usage

```
scp-git-files path/to/git/repo admin:password@example.com:/home/admin/
```

# Docs
## .gitignore
Currently this tool only supports a top level `.gitignore` file (`path/to/git/repo/.gitignore`).