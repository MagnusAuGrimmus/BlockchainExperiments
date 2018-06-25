rm -r ../build
mkfifo pipe
truffle develop <pipe &
pid=$!
echo "deploy" >pipe
sleep 10
echo "test" >pipe
sleep 65
kill -INT $pid
rm pipe