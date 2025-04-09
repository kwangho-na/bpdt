<script>
	cmd(name) {
		not(name) name='cmd'
		obj = _node("process.$name")
		if(obj.var(useModule)) {
			return obj;
		}
		return addModule(obj, '@cmd', name)
	}
	web(name) {
		not(name) name='common'
		obj = _node("web.$name")
		if(obj.var(useModule)) {
			return obj;
		}
		return addModule(obj, '@web', name)
	}
</script>

<script module="@web">
	init(name) {
		@web = Baro.web(name)
		setCallback(web, this.webProc, this)
	}
	callUrl(url) {
		this.set('resultData','')
		web.call(url)
	}
	postData(data) {
		web.set("data", data)
	}
	setHeader(k,v) {
		h = web.addNode("@header")
		h.set(k,v)
	}
	webProc(type, data ) {
		if(type.eq('read')) return this.appendText('resultData', data)
		if(type.eq('finish')) {
			if( typeof(this.finishFunc,'func')) {
				this.finishFunc(this.ref('resultData'))
			}
		}
	}
	setFinish(fc) {
		this.finishFunc = fc
	}
</script>

<script module="@cmd">
	init(name) {
		@proc=Baro.process(name)
		@cmdList=this.addArray("cmd.list");
		@status = 'stay'
		@currentProgram = 'cmd'
		this.runStartTick = System.localtime()
		setCallback(proc, this.cmdProc, this)
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
		this.run('chcp 65001')
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
			this.runStartTick = System.localtime()
			this.set('cmdResult','')
			proc.write(cmd);
		} else {
			dist = System.localtime() - this.runStartTick
			print("run time == $dist")
			if( dist > 5 ) {
				print("모든 명령을 실행 했습니다")
			}
		}
	}
	cmdProc(type,data) {
		if(type=='read') {
			this.appendText('cmdResult', data);
			c=data.ch(-1,true);
			if(c=='>') {
				@status = 'stay'
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
		print("cmd>> $result")
		logWriter('cmd').appendLog(result)
	}
</script>
