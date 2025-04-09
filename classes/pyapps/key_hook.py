import argparse
import os
import time
import keyboard

def print_key_event(e):
	print(f"Key {e.name} was {e.event_type}")

# keyboard.hook(print_key_event)

    
class CustomAction(argparse.Action):
	def __call__(self, parser, namespace, values, option_string=None):
		setattr(namespace, self.dest, " ".join(values))

# 인자값을 받을 수 있는 인스턴스 생성
parser = argparse.ArgumentParser(description='프로그램 확장기능 처리')

# 입력받을 인자값 등록
parser.add_argument('--log', action=CustomAction, nargs='+', required=True, help='로그파일')
parser.add_argument('--output', action=CustomAction, nargs='+', required=True, help='출력파일')
args = parser.parse_args()
try:
	f=open(args.log, 'r')
	fa=open(args.output, 'a')
	lastPos=f.seek(0, os.SEEK_END)
	tm=time.time()
	def log (msg):
		fa.write(f"##> {msg}\n")
		fa.flush()

	def keyMap (trigger, hotkey):
		log(f"{trigger}: {hotkey}")

	while True:
		dist=time.time()-tm
		fsize=os.stat(args.log).st_size
		if fsize>lastPos :
			line=f.read().strip()
			pos=line.find("##>")
			log(f"line:{line}")
			ftype='';
			if pos!=-1 :
				ftype=line[pos+3:].strip()
			if ftype=='quit': 
				break
			if ftype=='add-hotkey':
				keyboard.add_hotkey('alt+shift+c', print, args=('triggered', 'alt+shift+c'))
			elif ftype=='echo':
				log("echo")
			else:
				log(f"{ftype} not defined")
			lastPos=fsize
		time.sleep(0.2)
	log(f"close test python [filepath:{args.output}]")
	fa.close()
	f.close()	
except Exception as e:
	print(f" error: {e}")