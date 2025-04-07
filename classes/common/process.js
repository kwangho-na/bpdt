<script>
	cmd(name) {
		not(name) name='cmd'
		obj = object("process.$name")
		if(obj.var(useModule)) {
			return obj;
		}
		return addModule(obj, '@cmd', "cmd")
	}
</script>

<script module="@cmd">
	init(proc) {
		@proc=proc;
		@cmdList=this.addArray("cmd.list");
		@status = 'stay'
		@currentProgram = 'cmd'
		setCallback(this.cmdProc)
		this.start()
	}
	isRun() {
		return proc.run();
	}
	start(prog) {
		@status = 'stay'
		if( proc.run() ) {
			proc.close()
		} else {
			this.var(firstCall, true)
		}
		if(prog) {
			@currentProgram = prog
		} else {
			prog=this.member(currentProgram)
		}
		proc.run(prog, 0x400)
	}
	startPowershell() {
		this.start("powershell")
	}
	stop() {
		if( proc.run() ) {
			proc.kill()
			@status = 'stay'
		} else {
			print("cmd 가 실행중이 아닙니다")
		}
	}
	close() {
		this.stop()
	}
	run(cmd) {
		not( proc.run() ) {
			this.start()
		}
		not(status.eq("stay")) {
			return print("cmd 프로세스가 실행중입니다");
		}
		not(cmd) cmd=cmdList.pop()
		if(cmd) {
			@status = 'start'
			this.set('cmdResult','')
			proc.write(cmd);
		} else {
			@status = 'stay'
		}
	}
	cmdProc(type,data) {
		if(type=='read') {
			this.appendText('cmdResult', data);
			c=data.ch(-1,true);
			if(c=='>') {
				this.parseResult();
				this.run()
			}
		}
	}
	cmdAdd(cmd, run) {
		cmdList.add(cmd)
		if(run) this.run()
	}
	parseResult() {
		result = this.get('cmdResult')
		logWriter('cmd').appendLog(result)
	}
</script>
