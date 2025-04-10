<script module="@web">
	init(name, fc) {
		@web = Baro.web(name)
		@finishResultFunc = fc
		setCallback(web, this.webProc, this)
	}
	call(url) {
		this.set('resultData','')
		web.call(url)
	}
	setData(data) {
		web.set('method', 'POST')
		web.set('data', data)
	}
	setHeader(k,v) {
		h = web.addNode("@header")
		h.set(k,v)
	}
	webProc(type, data ) {
		if(type.eq('read')) return this.appendText('resultData', data)
		if(type.eq('finish')) {
			fc = this.member(finishResultFunc)
			if( fc ) call(fc, this, this.ref('resultData'))
		}
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

<script module="@job">
	init(name, type, callback) {
		@worker = Baro.worker(name)
		this.workerStartTick = System.localtime()
		this.jobType(type, callback)
	}
	workerId() {
		return worker.id;
	}
	jobType() {
		asize=args().size() not(asize) return this.member(type)
		args(type, callback)
		if(typeof(type,'func')) {
			fcStart=this.jobCallback(type)
			type = 'jobUser'
		} else {
			not(type) type = 'jobDefault'
			fcStart = this.jobCallback(type)	
			if(typeof(callback,'func')) worker.jobResultFunc = callback
		}
		@type = type
		not(typeof(fcStart,'func')) return print("jobType 작업시작 함수 미정의", type)
		worker.module = this
		worker.start(fcStart)
	}
	
	jobStart() {
		if(worker.is()) {
			print("작업이 이미 시작중입니다")
			return;
		}
		worker.start()
	}
	jobStop() {
		worker.stope()
	}
	jobAdd(job) {
		this.current
		worker.push(job)
	}
	jobList() {
		return worker.list()
	}
	jobCount() {
		return worker.list().size()
	}
	
	jobCallback(fc) {
		not(typeof(fc,'func')) fc=this.get(fc)
		not(typeof(fc,'func')) return print("jobCallback 함수 등록 오류 (콜백함수 미정의)")
		worker.callback(fc)
		return fc;
	}
	jobWeb(node) {
		not(node) return;
		// node => url, postData, header 설정
		callback = this.jobResultFunc
		if( node.urlTemplate ) {
			node.url = format(node.urlTemplate, node)
		}
		not(callback) return print("job 웹작업 callback 함수 미정의 (노드:$node)")
		not(node.url) return print("job 웹작업 URL 미정의 (노드:$node)") 
		web = web("worker_${this.id}", callback)
		if(node.postData) {
			web.setData(node.postData)
		}
		if(typeof(node.header,'node')) {
			header = node.header
			while(key, header.keys() ) {
				web.setHeader(key, header.get(key))
			}
		}
		web.currentWorker = this
		web.call(node.url)
	}
	jobDefault(job) {
		name = worker.id
		not(job) {
			print("worker $name 일괄 작업 종료")
		}
		print("worker $name 시작 [작업 노드:$job]")
	}
</script>



