import { PageContainer } from '@ant-design/pro-components';
import { useNavigate } from '@umijs/max';
import { Button } from 'antd';

const Login: React.FC = () => {
  const navigate = useNavigate();
  return (
    <PageContainer>
      <div style={{ paddingTop: 80 }}>
        <Button type="primary" onClick={() => navigate('/home')}>
          Go Home
        </Button>
      </div>
    </PageContainer>
  );
};

export default Login;
