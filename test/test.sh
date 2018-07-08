rm -r build
mkfifo pipe
truffle develop <pipe &
pid=$!
echo "deploy" >pipe
sleep 5
echo "test" >pipe
sleep 20
kill -INT $pid
rm pipe
