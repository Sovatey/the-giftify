import Guide from '@/components/Guide';
import { trim } from '@/utils/format';
import { PageContainer } from '@ant-design/pro-components';
import { useModel } from '@umijs/max';
import { Button, Typography } from 'antd';
import { useNavigate } from '@umijs/max';

const Login: React.FC = () => {
    const navigate = useNavigate();
    return (
        <PageContainer>
            <div style={{paddingTop: 80}}>
                <Button type="primary" onClick={()=>navigate('/home')}>Go Home</Button>
            </div>
        </PageContainer>
    );
};

export default Login;
