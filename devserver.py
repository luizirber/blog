#! /usr/bin/env python
import sys
from livereload import Server
server = Server()
server.watch('content', 'make html')
server.watch('*.py', 'make html')
server.watch('chunk', 'make html')
server.serve(
    root='output',
        open_url='open' in sys.argv,
        )
