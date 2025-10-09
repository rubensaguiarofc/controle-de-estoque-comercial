import type { StockItem } from '@/lib/types';

export const MOCK_STOCK_ITEMS: StockItem[] = [
    { id: 'ITM-001', name: 'Resistor 10k Ohm', quantity: 100, specifications: '1/4W, 5% de tolerância', barcode: '1234567890123' },
    { id: 'ITM-002', name: 'Capacitor Cerâmico 100nF', quantity: 250, specifications: '50V', barcode: '2345678901234' },
    { id: 'ITM-003', name: 'LED Vermelho 5mm', quantity: 500, specifications: '20mA, 2.2V', barcode: '3456789012345' },
    { id: 'ITM-004', name: 'Transistor BC548', quantity: 150, specifications: 'NPN', barcode: '4567890123456' },
    { id: 'ITM-005', name: 'Placa de Fenolite 10x15cm', quantity: 30, specifications: 'Face Simples', barcode: '5678901234567' },
    { id: 'ITM-006', name: 'Fio de Solda 60/40', quantity: 5, specifications: '1mm, 250g', barcode: '6789012345678' },
    { id: 'ITM-007', name: 'Protoboard 830 Furos', quantity: 20, specifications: '', barcode: '7890123456789' },
    { id: 'ITM-008', name: 'Conjunto de Jumpers Macho-Macho', quantity: 2, specifications: '65 peças', barcode: '8901234567890' },
    { id: 'ITM-009', name: 'Microcontrolador ATmega328P', quantity: 15, specifications: 'Com bootloader do Arduino', barcode: '9012345678901' },
    { id: 'ITM-010', name: 'Display LCD 16x2', quantity: 10, specifications: 'Backlight Azul', barcode: '0123456789012' },
];
