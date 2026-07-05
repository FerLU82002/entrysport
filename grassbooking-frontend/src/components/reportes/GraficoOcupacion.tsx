import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { DatoOcupacion } from '../../types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface Props {
  datos: DatoOcupacion[];
}

export const GraficoOcupacion = ({ datos }: Props) => {
  const dataFormateada = datos.map((d) => ({
    ...d,
    fechaCorta: format(parseISO(d.fecha), 'dd/MM', { locale: es }),
    porcentaje: d.porcentajeOcupacion,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={dataFormateada} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="fechaCorta" tick={{ fontSize: 11 }} />
        <YAxis
          tick={{ fontSize: 11 }}
          domain={[0, 100]}
          tickFormatter={(v) => `${v}%`}
        />
        <Tooltip
          formatter={(value: number) => [`${value}%`, 'Ocupación']}
          labelFormatter={(label) => `Fecha: ${label}`}
        />
        <Bar dataKey="porcentaje" radius={[4, 4, 0, 0]}>
          {dataFormateada.map((entry, index) => (
            <Cell
              key={index}
              fill={entry.porcentaje >= 70 ? '#16a34a' : entry.porcentaje >= 40 ? '#f97316' : '#94a3b8'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};
