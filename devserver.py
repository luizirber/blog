#! /usr/bin/env python
import sys
from livereload import Server
server = Server()
server.watch('content', 'pelican')
server.watch('*.py', 'pelican')
server.watch('chunk', 'pelican')
server.serve(
    root='output',
        open_url='open' in sys.argv,
        )
