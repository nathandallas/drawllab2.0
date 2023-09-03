'use client';

import { FunctionComponent, useState, useEffect } from 'react';
import { useDraw } from '@/hooks/useDraw';
import { drawLine } from '@/utils/drawLine';
import { HexColorPicker, HexColorInput } from 'react-colorful';
import { io } from 'socket.io-client';
const socket = io('http://localhost:3001');

interface pageProps {}

const page: FunctionComponent<pageProps> = ({}) => {
	const [color, setColor] = useState<string>('#000000');
	const { canvasRef, onMouseDown, clear } = useDraw(createLine);

	useEffect(() => {
		const ctx = canvasRef.current?.getContext('2d')

		socket.emit('client-ready')

		socket.on('get-canvas-state', () => {
			if (!canvasRef.current?.toDataURL()) return
			socket.emit('canvas-state', canvasRef.current.toDataURL())
		})

		socket.on('canvas-state-from-server', (state: string) => {
			console.log('I received the state')
			const img = new Image()
			img.src = state
			img.onload = () => {
			  ctx?.drawImage(img, 0, 0)
			}
		  })
	  
		socket.on(
			'draw-line',
			({ prevPoint, currentPoint, color }: DrawLineProps) => {
				if (!ctx) return;
				drawLine({ prevPoint, currentPoint, ctx, color });
			}
		);

		socket.on('clear', clear)

		return () => {
			socket.off('draw-line')
			socket.off('get-canvas-state')
			socket.off('canvas-state-from-server')
			socket.off('clear')
		  }
		  
	}, [canvasRef]);

	function createLine({ prevPoint, currentPoint, ctx }: Draw) {
		socket.emit('draw-line', { prevPoint, currentPoint, color });
		drawLine({ prevPoint, currentPoint, ctx, color });
	}

	return (
		<div className='w-screen h-screen bg-white flex'>
			<div className='flex flex-col gap-10 px-10 w-80 items-center'>
				<HexColorPicker color={color} onChange={setColor} className='' />
				<HexColorInput
					color={color}
					onChange={setColor}
					className='p-2 border border-black rounded-md'
					prefixed
					alpha
				/>
				<button
					type='button'
					onClick={() => socket.emit('clear')}
					className='p-2 rounded-md border border-black'
				>
					Clear
				</button>
			</div>

			<div>
				<canvas
					onMouseDown={onMouseDown}
					ref={canvasRef}
					width={750}
					height={750}
					className='border border-black rounded-md'
				/>
			</div>
		</div>
	);
};

export default page;
