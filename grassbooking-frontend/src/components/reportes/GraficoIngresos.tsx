import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { DatoIngreso } from '../../types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface Props {
  datos: DatoIngreso[];
}

export const GraficoIngresos = ({ datos }: Props) => {
  const dataFormateada = datos.map((d) => ({
    ...d,
    semanaCorta: d.semana
      ? format(parseISO(d.semana), "'Sem.' d/MM", { locale: es })
      : '',
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart
        data={dataFormateada}
        margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#eceeef" vertical={false} />
        <XAxis dataKey="semanaCorta" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={{ stroke: '#d7dade' }} tickLine={false} />
        <YAxis
          tick={{ fontSize: 11, fill: '#6b7280' }}
          tickFormatter={(v) => `S/${v}`}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          formatter={(value: number) => [`S/ ${value.toFixed(2)}`, 'Ingresos']}
          contentStyle={{ borderRadius: 8, borderColor: '#d7dade', fontSize: 13 }}
        />
        <Line
          type="monotone"
          dataKey="totalIngresos"
          stroke="#17181b"
          strokeWidth={2}
          dot={{ fill: '#17181b', r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};
