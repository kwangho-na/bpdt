widgetAdd(tag, id, props, module, target) {
	not(target) target = this
	not(tag) return print("make widget error (태그가 정의되지 않았습니다)", args());
	base = left(target.var(baseCode))
	widget=object("${tag}.${base}:${id}") if(typeof(widget,'widget')) return widget;
	if(props) widget.parseJson(props)
	widget.with(id, tag)
	widget.var(baseCode, "$base:$id")
	target.createWidget(widget) not( typeof(widget,'widget') ) return print("widgetAdd 위젯생성 오류 (태그:$tag, 아이디:$id)")
	if( module) {
		addModule(widget, module)
	}
	if( target ) {
		if( widget.rectId ) {
			if( target != widget.parentWidget()) {
				widget.flags("child"); 
				widget.parentWidget(target);
			}
		}
		if( widget.popup ) {
			widget.parentWidget(null)
			widget.flags('tool', true)
		}
		list = target.get('@widgetList')
		if(list) {
			not(list.find(widget)) list.add(widget)
		}
	}
	return widget; 
}
 
splitterSize(s,a,n) {
	tot=s.sizes().sum()
	s.sizes(recalc(tot,a))
	if(typeof(n,'num')) s.stretchFactor(n,1)
}
 