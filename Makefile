clean:
	rm -rf test/**/.vscode 2> /dev/null
	rm -rf test/**/build 2> /dev/null

.phony: clean
