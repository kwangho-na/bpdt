<script module="@editor">
	editorSearch(mode) {	
		if( mode&KEY.ctrl ) {
			str = this.text('select');
			not( str ) {
				str=this.text('word');			
			}
			if(str) {
				global("prevSearchValue",str);
			} else {
				str=global("prevSearchValue");
			}
		} else {
			str=global("prevSearchValue");
		}
		not( str ) {
			System.beep();
			return;
		}
		this.var(prevSearchValue, str);
		if( mode&KEY.shift ) {
			this.searchPrev(str);
		} else {
			this.searchNext(str);
		}
		return true;
	}
	editorStartIndent( &str) {
		flag = 0x100 | 1;
		in = str.match('{','}',flag);
		if(typeof(in,'bool')) return false;
		not( in.find("\n") ) return false;	// 매칭문자열이 같은줄이라면 무시한다
		indent = str.findLast("\n").right();
		// #2  에디터 현재 위치 내용에 따른 처리
		line = this.sp().spText('lineStart');
		val = '';
		if( line.check(" \t") ) {
			pos = this.pos();
			start = pos-line.size();
			this.movePos(start).movePos(pos,true);
		} else { 
			val.add("\n");
		}
		// #3. indent 를 넣어준다.
		if( indent ) {
			val.add( indentText(indent) );
		} else {
			val.add( indentText(str) );
		}
		return val;
	}
	editorCopyLine( mode) {
		sp=0, ep=0;
		if( this.is('select') ) {
			sp=this.pos('selectStart', 'lineStart'), ep=this.pos('selectEnd','lineEnd');
			if( this.pos('selectEnd')==this.pos('selectEnd','lineStart') ) {
				ep=this.pos('selectEnd') - 1;
			} else {
				ep=this.pos('selectEnd','lineEnd');
			}
			str=this.movePos(sp).movePos(ep,true).text('select');
		} else {
			sp=this.pos('lineStart'), ep=this.pos('lineEnd');
			str=this.movePos(sp).movePos(ep,true).text('select');
		} 
		dsp=this.pos('down','lineStart');
		this.movePos(dsp);
		this.insert(str);
		return true;
	} 
	editorUpPress() {
		sp=0,ep=0;
		ok=false;
		if( this.is('select') ) {
			sp=this.pos('selectStart', 'lineStart'), ep=this.pos('selectEnd','lineEnd');
			if( this.pos('selectEnd')==this.pos('selectEnd','lineStart') ) {
				ep=this.pos('selectEnd')-1;
			} else {
				ep=this.pos('selectEnd','lineEnd');
			}
			str=this.movePos(sp).movePos(ep,true).text('select');
			if( str.find("\n") ) {
				ok=true;
			}
		}
		not( ok ) {
			sp=this.pos('lineStart'), ep=this.pos('lineEnd');
			str=this.movePos(sp).movePos(ep,true).text('select');
		}
		not(sp,ep) return;
		ep+=1;
		end=this.pos('end');
		if( ep.gt(end) ) ep=end;
		this.movePos(sp).movePos(ep, true);
		this.insert('');
		usp=this.pos('up','lineStart'), uep=this.pos('up','lineEnd');
		upLine=this.movePos(usp).movePos(uep,true).text('select');
		indent=indentText( upLine );
		len=str.length();
		sp=usp, ep=usp+len;
		this.insert("$str\n$upLine");
		this.movePos(sp).movePos(ep,true);
		return true;
	}

	editorDownPress() {
		sp=0, ep=0;
		ok=false;
		if( this.is('select') ) {
			sp=this.pos('selectStart', 'lineStart'), ep=this.pos('selectEnd','lineEnd');
			if( this.pos('selectEnd')==this.pos('selectEnd','lineStart') ) {
				ep=this.pos('selectEnd') - 1;
			} else {
				ep=this.pos('selectEnd','lineEnd');
			}
			str=this.movePos(sp).movePos(ep,true).text('select');
			if( str.find("\n") ) {
				ok=true;
			}
		}
		not( ok ) {
			sp=this.pos('lineStart'), ep=this.pos('lineEnd');
			str=this.movePos(sp).movePos(ep,true).text('select');
		}
		not(sp, ep) return;
		end=this.pos('end');
		dsp=this.pos('down','lineStart'), dep=this.pos('down','lineEnd');
		if( dep >= end ) return;
		if( dsp < dep ) {
			downLine=this.movePos(dsp).movePos(dep,true).text("select");
			len=str.length(), dlen=downLine.length();
			dep+=1;
			this.movePos(sp).movePos(dep,true);
			this.insert("$downLine\n$str\n");
			dlen+=1;
			sp+=dlen, ep=sp+len;
			this.movePos(sp).movePos(ep,true);
		}
		return true;
	}
</script>

<script module="@editor:editorSource">
	init() {
		addModule('editor')
	}
	onCursorChange() {
		editor=this;
		dist=editor.timeVal(changeTick) not(dist) return editor.timeVal(changeTick, true);
		if(dist<1500) return;
		editor.findAll();
		text=editor.text('word') not(text) return;
		if(text.is('oper')) return;
		editor.findAll(text);
		editor.timeVal(changeTick, true);
	}
	onMouseWheel(pos, delta, mode) {
		not( mode&KEY.ctrl ) return;
		num=delta/60;
		this.zoomIn(num.toInt() );
		return true;
	}
	onKeyDown(key, mode) {
		return this.editorKeyDown( key, mode)
	}
	onContentChange(pos, add, remove) {
		this.editorContentChange( pos, add, remove);
	}
	onChange() {
		if( this.isSyntaxString() ) return;
		text=this.sp().spText('prevWord', 'prevChar');
		if(text.ch('<')) {
			this.editorTagInsert( text.value(1));
		}
	}
	isSyntaxString() {
		key=this.prevKey;
		if( key && key.eq(16777219, 16777223) ) {
			return true;
		}
		sty=this.syntaxAt();
		if( sty ) {
			clr=right(sty,',');
			if( clr.eq('#FF00FF') ) return true;
		}
		return false;
	}
	
	editorKeyDown(key, mode) { 
		if( key.eq(KEY.Return, KEY.Enter) ) {
			if( mode&KEY.ctrl ) {
				page().runScript(key);
				return true;
			}
			return this.editorKeyEnter(mode);
		}
		if( key.eq(KEY.Tab) ) {
			if( this.editorSourceKeyMap(true)) return true;
			return this.tabPositionsMove( mode&KEY.ctrl );
		}
		switch( key ) {
		case KEY.F3:	return this.editorSearch(mode);
		case 34:	return this.editorKeyString('"');
		case 39:	return this.editorKeyString("'");
		case 41:	return this.startBlockMark("(");
		case 93:	return this.startBlockMark("[");
		case 123:	return this.braketStart();
		case 125:	return this.braketEnd();
		default:
		}
		if( mode&KEY.ctrl ) {
			if( key.eq(KEY.S, KEY.R, KEY.B) ) {
				return page().runScript(key);
			} else if(key.eq(KEY.E) ) {
				return page().keyMapInput();
			} else if(key.eq(KEY.Q) ) {
				return page().keyTemplateInput();
			} else if(key.eq(KEY.F) ) {
				return page().searchFocus(editor);
			} else if(key.eq(KEY.D) ) {
				return this.editorCopyLine(mode); 
			} else if(key.eq(KEY.K) ) { 
				return page().keymapInfo(editor);
			} else if(key.eq(KEY.Up)) {
				return this.editorUpPress(editor);
			} else if(key.eq(KEY.Down)) {
				return this.editorDownPress(editor);
			}
		}
		this.prevKey=key;
	}
	tabPositionsMove( back ) {
		tabArray=this.var(tapPositions);
		not(tabArray&&tabArray.size()) return false;
		pos=this.pos();
		if( back ) {
			idx=this[tabPositionsIndex--];
			if( idx.lt(0) ) {
				this[tabPositionsIndex=0];
				idx=0;
			}
		} else {
			idx=this[tabPositionsIndex++];
		}
		end=this.pos('end');
		pt=tabArray.get(idx);
		print("#### pt ####", pt, idx );
		not( pt ) {
			return _finish();
		}
		pt.inject(sp,ep);
		if( sp>=end ) {
			if( sp.eq(end) ) {
				this.movePos(sp);
			}
			return _finish();
		}
		size=ep-sp;
		if( size>1 ) {
			this.select(sp,ep);
		} else {
			this.movePos(sp);
		}
		return true;

		_finish=func() {
			this.tabPositionsIndex=0;
			tabArray.reuse();
			return true;
		}
	}
	editorContentChange( pos, add, remove ) {
		tabArray=this.var(tapPositions);
		not( tabArray.size() ) return;
		if( add.eq(remove) ) {
		return;
		}
		if( add ) {
			/* 한글입력 처리 */
			n1=add-remove;
			if( n1.eq(1) ) {
				/* 한글입력 경우 */
				pos=this.pos()-1;
				add=1, remove=0;
			} else if( n1.lt(0) && add.gt(1) ) {
				/* 선택 한글입력 경우 */
				pos=this.pos();
				remove-=add;
				add=0;
			}
		}

		if( remove ) {
			arr=_arr();
			end=this.pos('end');
			end+=remove;
			while( idx=0, idx<tabArray.size(); idx++ ) {
				cur=tabArray.get(idx);
				cur.inject(sp,ep);
				if( sp.gt(end) ) {
					arr.add(cur);
					break;
				}
				if( pos.ge(ep) ) {
					continue;
				}
				chk=pos.gt(sp) && pos.lt(ep);

				if( chk ) {
					size=ep-sp;
					if( remove.ge(size) ) {
						arr.add(cur);
					} else {
						ep-=remove;
					}
				} else {
					epos=pos+remove;
					if( epos.lt(sp) ) {
						sp-=remove, ep-=remove;
					} else if( epos.gt(ep) ) {
						arr.add(cur);
					} else {
						ep-=remove;
					}
				}
				tabArray.set( idx, Baro.point(sp, ep) );
			}
			while( cur, arr ) {
				tabArray.remove(cur);
			}
		}
		if( add ) {
			while( idx=0, idx<tabArray.size(), idx++ ) {
				tabArray.get(idx).inject(sp,ep);
				if( pos.gt(ep) ) continue;
				if( sp.eq(ep) ) {
					chk=sp.eq(pos);
				} else {
					chk=pos.ge(sp) && pos.le(ep);
				}
				if( chk ) {
					ep+=add;
				} else {
					sp+=add, ep+=add;
				}
				tabArray.set(idx, Baro.point(sp,ep) );
			}
		}
		return tabArray;
	}
	editorSourceKeyMap(tab) { 
		if(this.is("select")) return false;
		ch=this.text('prevChar');
		code='';
		if(tab) {
		code=this.sp().spText('prevChar', 'prevWord');
		len=code.length();
		code.add("`");
		} else if(ch.eq(" ")) {
			text=this.sp().spText('prevChar','prevWord','prevChar');
			ch=text.ch();
		not(ch.eq('/')) return false;
		code=text.trim();
		len=text.length();
		chk=4;
		}
		not(len) return false;
		map=this.var(keyMap);
		not(map ) return false;
		str=map.get(code);
		if( str) {
			pos=this.pos();
			this.select(pos-len, pos);
			if(str.find("\n")) {
				line=this.text("lineStart");
				indent=indentText(line);
				this.insertIndent(str, indent);
			} else {
				this.insert(str, true);
			}
			return true;
		}
		return false;
	}
	editorTagInsert(tag) { 
		if( tag.eq('page','pages','form','row','group','hbox','vbox', 'inline','dialog','func','call','widgets') ) {
			this.insertIndent(">\n\t^|\n</$tag>", null, 'lineEnd');
		} else if( tag.eq('button', 'check', 'radio') ) {
			this.insert(' id="^|" text="^|">', true );
		} else if( tag.eq('tree','grid','this', 'tab', 'div', 'player') ) {
			this.insert('^|>', true );
		} else if( tag.eq('combo','date','time','webview', 'context', 'canvas', 'input', 'spin', 'calendar', 'progress') ) {
			this.insert(' id="^|">', true );
		} else if( tag.eq('label') ) {
			this.insert(' text="^|">', true );
		} else if( tag.eq('spa') ) {
			this.insert("ce>");
		}
	}
	insertIndent( &str, indent, pos ) {
		if( pos ) this.movePos(pos);
		not( indent ) {
			line=this.sp('lineStart').spText();
			indent=indentText(line);
		}
		rst='';
		while( str.valid(), num ) {
			left=str.findPos("\n");
			if(num) rst.add("\n", indent);
			rst.add(left);
		}
		this.insert( rst, true);
		return true;
	}
	editorKeyEnter() {
		pos=this.pos();
		if( pos==this.pos('lineStart') ) {
			return false;
		}
		line=this.sp('lineStart').spText();
		indent=indentText(line);
		line.ref();
		size=line.length();
		ch=line.prevChar();
		size-=line.length();
		if( ch.eq("{", ":", "[") ) {
			val=line.trim();
			c=this.text('nextChar');
			print("#### keyEnter nextChar==$c ####", val);
			if( ch.eq('{') && c.eq('}') ) {
				this.insert("\n$indent\t^|\n$indent", true);
				return true;
			}
			if( ch.eq('[') && c.eq(']') ) {
				this.insert("\n$indent\t^|\n$indent", true);
				return true;
			}
			not( val.start('switch') ) {
				indent.add("\t");
			}
		}
		/* 커서 앞에 공백제거 */
		size-=1;
		if( size>0 ) {
			sp=pos-size;
			this.movePos(sp,true);
			this.insert("");
		}
		/* 커서뒤 공백제거 */
		remain=this.sp().spText('lineEnd');
		if( remain ) {
			blank=indentText(remain);
			pos=this.pos() + blank.size();
			this.movePos(pos, true);
		}
		this.insert("\n$indent");
		return true;
	}
	
	
	editorKeyString( c ) {
		if( this.is('select') ) return false;
		if( _check(c) ) return true;
		str=this.text('prevWord');
		ch=str.prevChar();
		if( ch.eq('=',',','(') ) {
			this.insert("$c^|$c", true);
			return true;
		}
		_check=func(c) {
			ch = this.text('nextChar');
			if( ch.eq(c) ) {
				cur=this.pos();
				this.pos(cur+1);
				return true;
			}
			return false;
		};
		return false;
	} 
	braketStart() {
		if( this.isSyntaxString()) return false;
		str=this.text('prevWord');
		ch=str.prevChar();
		print("#### $str, $ch ####");
		if( str.start('else') || ch.eq(')') ) {
			line=this.sp('lineStart').spText();
			val=line.trim();
			if( val.start('switch') ) {
				this.insertIndent("{\ncase ^|:\ndefault:\n}");
			} else {
				this.insertIndent("{\n\t^|\n}");
			}
			return true;
		}
		return false;
	}
	braketEnd() {
		if( this.isSyntaxString()) return false;
		str=this.sp().spText('start');
		str.add("}");
		indent = this.editorStartIndent( str );
		if( indent ) {
			this.insert(indent);
		}
		return false;
	}
	startBlockMark(ch) { 
		if( ch.eq('(')) {
			start="(", end=")";
		} else {
			start="[", end="]";
		}
		str=this.sp().spText(-128);
		str.add(end);
		str.ref();
		ep=str.cur(-1);
		in=str.match(start,end,0x101);
		if(typeof(in,'bool')) return false;
		if(in.size() ) {
			sp=str.cur(-1);
			sp+= 1;
			len=str.pos(sp,ep).length();
			if(len>2) {
				pos = this.pos() - len;
				this.insert(end);
				this.mark( pos, pos+1 );
				return true;
			}
		}
		return false;
	}

	
</script>
