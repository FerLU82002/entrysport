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
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="semanaCorta" tick={{ fontSize: 11 }} />
        <YAxis
          tick={{ fontSize: 11 }}
          tickFormatter={(v) => `S/${v}`}
        />
        <Tooltip
          formatter={(value: number) => [`S/ ${value.toFixed(2)}`, 'Ingresos']}
        />
        <Line
          type="monotone"
          dataKey="totalIngresos"
          stroke="#16a34a"
          strokeWidth={2.5}
          dot={{ fill: '#16a34a', r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};
